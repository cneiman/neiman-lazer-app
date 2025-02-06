// Import necessary types from the run module and shopify_function crate
use run::input::InputCart as Cart;  // Alias InputCart as Cart for cleaner code
use run::input::InputCartLinesMerchandise::ProductVariant;  // Enum variant for product variants
use run::input::InputCartLinesMerchandiseOnProductVariant;  // Type for product variant data
use run::output::CartOperation;  // Enum for different cart operations
use run::output::ExpandOperation;  // Struct for expanding cart items
use run::output::ExpandedItem;  // Struct representing an expanded cart item
use shopify_function::prelude::*;  // Import common Shopify Function utilities
use shopify_function::Result;  // Result type for error handling

// Macro that sets up the function as a Shopify Function
// Specifies the GraphQL query and schema paths
#[shopify_function_target(query_path = "src/run.graphql", schema_path = "schema.graphql")]
fn run(input: input::ResponseData) -> Result<output::FunctionRunResult> {
    // Process the cart and get a vector of cart operations
    let cart_operations: Vec<CartOperation> = get_expand_cart_operations(&input.cart);

    // Return the result wrapped in Ok() since this is a Result type
    // This indicates successful execution
    Ok(output::FunctionRunResult {
        operations: cart_operations,
    })
}

// Main function to process the cart and generate expansion operations
fn get_expand_cart_operations(cart: &Cart) -> Vec<CartOperation> {
    // Initialize an empty vector to store cart operations
    let mut result: Vec<CartOperation> = Vec::new();

    // Iterate through each line in the cart
    for line in cart.lines.iter() {
        // Try to get the product variant from the merchandise
        // Using pattern matching to safely handle the enum
        let variant = match &line.merchandise {
            ProductVariant(variant) => Some(variant),  // If it's a ProductVariant, wrap it in Some
            _ => None,  // For all other cases, return None
        };
        // Skip this iteration if there's no variant
        if variant == None {
            continue;
        }

        // If we have a valid variant, process it
        if let Some(merchandise) = &variant {
            // Get component references (IDs) for this variant
            let component_references: Vec<ID> = get_component_references(&merchandise);

            // Skip if there are no component references
            if component_references.is_empty() {
                continue;
            }

            // Initialize vector to store expanded items
            let mut expand_relationships: Vec<ExpandedItem> = Vec::new();

            // Process each component reference
            for reference in component_references.iter() {
                // Create a new ExpandedItem for each reference
                let expand_relationship: ExpandedItem = ExpandedItem {
                    merchandise_id: reference.clone(),  // Clone the ID for ownership
                    quantity: 1,
                    price: None,  // Optional price not set
                    attributes: None,  // Optional attributes not set
                };

                // Add the expanded item to our collection
                expand_relationships.push(expand_relationship);
            }

            // Create an ExpandOperation with the collected items
            let expand_operation: ExpandOperation = ExpandOperation {
                cart_line_id: line.id.clone(),  // Clone the ID for ownership
                expanded_cart_items: expand_relationships,
                price: None,  // Optional fields not set
                image: None,
                title: None,
            };

            // Add the expand operation to our result vector
            result.push(CartOperation::Expand(expand_operation));
        }
    }

    return result;
}

// Helper function to extract component references from a variant
fn get_component_references(variant: &InputCartLinesMerchandiseOnProductVariant) -> Vec<ID> {
    // Check if the variant has a component_reference metafield
    if let Some(component_reference_metafield) = &variant.component_reference {
        // Parse the JSON string value into a Vec<ID>
        // unwrap() is used here assuming the JSON is valid
        return serde_json::from_str(&component_reference_metafield.value).unwrap();
    }

    // Return empty vector if no component references found
    return Vec::new();
}

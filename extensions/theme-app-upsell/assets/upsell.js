// Helper Functions
const fetchConfig = (type = 'json') => {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': `application/${type}`
    }
  };
};

function getSectionsToRender() {
  if (window.location.href.includes('/cart')) {
    return [
      {
        id: 'cart-icon-bubble',
        section: 'header',
        selector: '#cart-icon-bubble'
      },
      {
        id: 'main-cart-items',
        section: 'main-cart',
        selector: '#main-cart-items'
      },
      {
        id: 'cart-item-count',
        section: 'main-cart',
        selector: '#cart-item-count'
      }
    ];
  } else {
    return [
      {
        id: 'cart-drawer__inner',
        section: 'cart-drawer',
        selector: '#cart-drawer__inner',
      },
      {
        id: 'cart-icon-bubble',
        section: 'header',
        selector: '#cart-icon-bubble'
      },
      {
        id: 'cart-count',
        section: 'cart-drawer',
        selector: '#cart-count',
      }
    ];
  }
}

function getSectionInnerHTML(html, selector) {
  return new DOMParser()
    .parseFromString(html, 'text/html')
    .querySelector(selector).innerHTML;
}

function serializeForm(form) {
  const obj = {};
  const formData = new FormData(form);
  for (const key of formData.keys()) {
    obj[key] = formData.get(key);
  }
  return JSON.stringify(obj);
}

function reInitUpsellSliders() {
  if (window.location.href.includes('/cart')) {
    const cartItems = document.querySelector('cart-items');
    const upsellSlider = cartItems?.querySelector('.cart-upsells-slider');

    if (upsellSlider && cartItems.initUpsellSlider) {
      cartItems.initUpsellSlider();
    }
  } else {
    const cartDrawer = document.querySelector('cart-drawer');
    const upsellSlider = cartDrawer?.querySelector('.cart-upsells-slider');

    if (upsellSlider && cartDrawer.initUpsellSlider) {
      cartDrawer.initUpsellSlider();
    }
    cartDrawer?.open();
  }
}

// Handle add to cart functionality for the upsell block
document.addEventListener('DOMContentLoaded', () => {
  const upsellForms = document.querySelectorAll('.upsell-form');
  const cartDrawer = document.querySelector('cart-drawer');

  upsellForms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitButton = form.querySelector('.upsell-add-to-cart');
      submitButton.classList.add('loading');
      submitButton.disabled = true;

      try {
        // Match the product form structure
        const body = JSON.stringify({
          ...JSON.parse(serializeForm(form)),
          sections: getSectionsToRender().map((section) => section.section),
          sections_url: window.location.pathname
        });

        const response = await fetch(`${routes.cart_add_url}`, {
          ...fetchConfig('javascript'),
          body
        });

        if (!response.ok) throw new Error('Add to cart failed');

        const parsedState = await response.json();

        // Update sections
        getSectionsToRender().forEach((section => {
          const elementToReplace =
            document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);

          elementToReplace.innerHTML =
            getSectionInnerHTML(parsedState.sections[section.section], section.selector);
        }));

        // Success state
        submitButton.textContent = 'Added!';

        // Open cart drawer and reinit sliders
        if (cartDrawer) {
          cartDrawer.open();
        }
        if (typeof window.reInitUpsellSliders === 'function') {
          window.reInitUpsellSliders();
        }

      } catch (error) {
        console.error('Error adding to cart:', error);
        submitButton.textContent = 'Error';
      } finally {
        // Reset button state
        setTimeout(() => {
          submitButton.classList.remove('loading');
          submitButton.disabled = false;
          submitButton.textContent = 'Add to Cart';
        }, 2000);
      }
    });
  });
});

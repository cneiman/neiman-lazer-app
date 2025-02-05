import { extension, Banner, BlockStack, TextBlock } from '@shopify/ui-extensions/customer-account';

export default extension('customer-account.order-status.block.render', (root, api) => {
  const { i18n } = api;

  const banner = root.createComponent(
    Banner,
    {}
  )

  const block = root.createComponent(
    BlockStack,
    {inlineAlignment: "center"}
  )

  const text = root.createComponent(
    TextBlock,
    {},
    i18n.translate("earnPoints")
  )

  block.appendChild(text)
  banner.appendChild(block)
  root.appendChild(banner);
});
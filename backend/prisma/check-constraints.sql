-- Add this SQL to the initial Prisma migration before applying it.
-- MySQL 8.0.16+ enforces CHECK constraints.

ALTER TABLE `products`
  ADD CONSTRAINT `chk_products_base_price_non_negative`
    CHECK (`base_price` >= 0),
  ADD CONSTRAINT `chk_products_sale_price_valid`
    CHECK (`sale_price` IS NULL OR (`sale_price` >= 0 AND `sale_price` <= `base_price`));

ALTER TABLE `upload_assets`
  ADD CONSTRAINT `chk_upload_assets_dimensions_positive`
    CHECK ((`width` IS NULL OR `width` > 0) AND (`height` IS NULL OR `height` > 0)),
  ADD CONSTRAINT `chk_upload_assets_bytes_positive`
    CHECK (`bytes` > 0);

ALTER TABLE `product_variants`
  ADD CONSTRAINT `chk_product_variants_stock_non_negative`
    CHECK (`stock` >= 0),
  ADD CONSTRAINT `chk_product_variants_price_non_negative`
    CHECK (`price` IS NULL OR `price` >= 0),
  ADD CONSTRAINT `chk_product_variants_sale_price_non_negative`
    CHECK (`sale_price` IS NULL OR `sale_price` >= 0),
  ADD CONSTRAINT `chk_product_variants_sale_not_above_price`
    CHECK (`sale_price` IS NULL OR `price` IS NULL OR `sale_price` <= `price`);

ALTER TABLE `cart_items`
  ADD CONSTRAINT `chk_cart_items_quantity_positive`
    CHECK (`quantity` >= 1);

ALTER TABLE `coupons`
  ADD CONSTRAINT `chk_coupons_value_positive`
    CHECK (`value` > 0),
  ADD CONSTRAINT `chk_coupons_min_order_non_negative`
    CHECK (`min_order_value` >= 0),
  ADD CONSTRAINT `chk_coupons_max_discount_positive`
    CHECK (`max_discount` IS NULL OR `max_discount` > 0),
  ADD CONSTRAINT `chk_coupons_valid_window`
    CHECK (`end_at` > `start_at`),
  ADD CONSTRAINT `chk_coupons_limits_positive`
    CHECK ((`usage_limit` IS NULL OR `usage_limit` > 0) AND (`per_user_limit` IS NULL OR `per_user_limit` > 0)),
  ADD CONSTRAINT `chk_coupons_used_count_valid`
    CHECK (`used_count` >= 0 AND (`usage_limit` IS NULL OR `used_count` <= `usage_limit`)),
  ADD CONSTRAINT `chk_coupons_percent_value_valid`
    CHECK (`type` <> 'PERCENT' OR `value` <= 100);

ALTER TABLE `orders`
  ADD CONSTRAINT `chk_orders_money_non_negative`
    CHECK (`subtotal` >= 0 AND `discount` >= 0 AND `shipping_fee` >= 0 AND `total` >= 0),
  ADD CONSTRAINT `chk_orders_discount_not_above_subtotal`
    CHECK (`discount` <= `subtotal`),
  ADD CONSTRAINT `chk_orders_total_formula`
    CHECK (`total` = (`subtotal` - `discount` + `shipping_fee`));

ALTER TABLE `order_items`
  ADD CONSTRAINT `chk_order_items_price_non_negative`
    CHECK (`unit_price` >= 0 AND `subtotal` >= 0),
  ADD CONSTRAINT `chk_order_items_quantity_positive`
    CHECK (`quantity` >= 1),
  ADD CONSTRAINT `chk_order_items_subtotal_formula`
    CHECK (`subtotal` = (`unit_price` * `quantity`));

ALTER TABLE `coupon_redemptions`
  ADD CONSTRAINT `chk_coupon_redemptions_discount_non_negative`
    CHECK (`discount_amount` >= 0);

ALTER TABLE `payments`
  ADD CONSTRAINT `chk_payments_amount_non_negative`
    CHECK (`amount` >= 0);

ALTER TABLE `inventory_transactions`
  ADD CONSTRAINT `chk_inventory_stocks_non_negative`
    CHECK (`stock_before` >= 0 AND `stock_after` >= 0),
  ADD CONSTRAINT `chk_inventory_delta_non_zero`
    CHECK (`quantity_delta` <> 0),
  ADD CONSTRAINT `chk_inventory_balance`
    CHECK (`stock_after` = (`stock_before` + `quantity_delta`)),
  ADD CONSTRAINT `chk_inventory_direction`
    CHECK (
      (`type` = 'SALE' AND `quantity_delta` < 0)
      OR (`type` IN ('IMPORT', 'CANCEL_RETURN', 'RETURN') AND `quantity_delta` > 0)
      OR (`type` = 'MANUAL_ADJUSTMENT' AND `quantity_delta` <> 0)
    );

ALTER TABLE `reviews`
  ADD CONSTRAINT `chk_reviews_rating_range`
    CHECK (`rating` BETWEEN 1 AND 5);

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(32) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `avatar_url` VARCHAR(2048) NULL,
    `role` ENUM('CUSTOMER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `token_version` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `uq_users_email`(`email`),
    INDEX `idx_users_phone`(`phone`),
    INDEX `idx_users_role_active`(`role`, `is_active`),
    INDEX `idx_users_deleted_at`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_sessions` (
    `id` VARCHAR(32) NOT NULL,
    `user_id` VARCHAR(32) NOT NULL,
    `family_id` VARCHAR(32) NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `replaced_by_id` VARCHAR(32) NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(512) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_refresh_sessions_token_hash`(`token_hash`),
    UNIQUE INDEX `uq_refresh_sessions_replaced_by`(`replaced_by_id`),
    INDEX `idx_refresh_sessions_user_revoked`(`user_id`, `revoked_at`),
    INDEX `idx_refresh_sessions_family_revoked`(`family_id`, `revoked_at`),
    INDEX `idx_refresh_sessions_expires_at`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `id` VARCHAR(32) NOT NULL,
    `user_id` VARCHAR(32) NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_password_reset_tokens_hash`(`token_hash`),
    INDEX `idx_password_reset_tokens_expires_at`(`expires_at`),
    INDEX `idx_password_reset_tokens_user_used`(`user_id`, `used_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `addresses` (
    `id` VARCHAR(32) NOT NULL,
    `user_id` VARCHAR(32) NOT NULL,
    `recipient_name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `line1` VARCHAR(255) NOT NULL,
    `line2` VARCHAR(255) NULL,
    `ward` VARCHAR(100) NOT NULL,
    `district` VARCHAR(100) NOT NULL,
    `province` VARCHAR(100) NOT NULL,
    `postal_code` VARCHAR(20) NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_addresses_user_default`(`user_id`, `is_default`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` VARCHAR(32) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `description` TEXT NULL,
    `image_url` VARCHAR(2048) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `uq_categories_slug`(`slug`),
    INDEX `idx_categories_active_sort`(`is_active`, `sort_order`),
    INDEX `idx_categories_name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `brands` (
    `id` VARCHAR(32) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `logo_url` VARCHAR(2048) NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `uq_brands_slug`(`slug`),
    INDEX `idx_brands_active_sort`(`is_active`, `sort_order`),
    INDEX `idx_brands_name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` VARCHAR(32) NOT NULL,
    `category_id` VARCHAR(32) NOT NULL,
    `brand_id` VARCHAR(32) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `slug` VARCHAR(220) NOT NULL,
    `short_description` VARCHAR(500) NULL,
    `description` TEXT NULL,
    `base_price` DECIMAL(12, 2) NOT NULL,
    `sale_price` DECIMAL(12, 2) NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'DRAFT',
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `published_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `uq_products_slug`(`slug`),
    INDEX `idx_products_name`(`name`),
    INDEX `idx_products_status_created`(`status`, `created_at`),
    INDEX `idx_products_category_status`(`category_id`, `status`),
    INDEX `idx_products_brand_status`(`brand_id`, `status`),
    INDEX `idx_products_featured_status`(`is_featured`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `upload_assets` (
    `id` VARCHAR(32) NOT NULL,
    `provider` ENUM('LOCAL', 'CLOUDINARY') NOT NULL,
    `provider_asset_id` VARCHAR(255) NOT NULL,
    `url` VARCHAR(2048) NOT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `format` VARCHAR(20) NOT NULL,
    `bytes` INTEGER NOT NULL,
    `uploaded_by_id` VARCHAR(32) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    INDEX `idx_upload_assets_deleted_at`(`deleted_at`),
    UNIQUE INDEX `uq_upload_assets_provider_asset`(`provider`, `provider_asset_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_images` (
    `id` VARCHAR(32) NOT NULL,
    `product_id` VARCHAR(32) NOT NULL,
    `asset_id` VARCHAR(32) NULL,
    `url_snapshot` VARCHAR(2048) NOT NULL,
    `alt_text` VARCHAR(255) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_product_images_product_primary`(`product_id`, `is_primary`),
    INDEX `idx_product_images_asset`(`asset_id`),
    UNIQUE INDEX `uq_product_images_product_sort`(`product_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sizes` (
    `id` VARCHAR(32) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `slug` VARCHAR(60) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `uq_sizes_name`(`name`),
    UNIQUE INDEX `uq_sizes_slug`(`slug`),
    INDEX `idx_sizes_active_sort`(`is_active`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `colors` (
    `id` VARCHAR(32) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `hex_code` CHAR(7) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `uq_colors_name`(`name`),
    UNIQUE INDEX `uq_colors_slug`(`slug`),
    INDEX `idx_colors_active_sort`(`is_active`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_variants` (
    `id` VARCHAR(32) NOT NULL,
    `product_id` VARCHAR(32) NOT NULL,
    `size_id` VARCHAR(32) NOT NULL,
    `color_id` VARCHAR(32) NOT NULL,
    `sku` VARCHAR(64) NOT NULL,
    `price` DECIMAL(12, 2) NULL,
    `sale_price` DECIMAL(12, 2) NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `uq_product_variants_sku`(`sku`),
    INDEX `idx_product_variants_product_active`(`product_id`, `is_active`),
    INDEX `idx_product_variants_stock_active`(`stock`, `is_active`),
    INDEX `idx_product_variants_size_stock`(`size_id`, `stock`),
    INDEX `idx_product_variants_color_stock`(`color_id`, `stock`),
    UNIQUE INDEX `uq_product_variants_combination`(`product_id`, `size_id`, `color_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `carts` (
    `id` VARCHAR(32) NOT NULL,
    `user_id` VARCHAR(32) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uq_carts_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cart_items` (
    `id` VARCHAR(32) NOT NULL,
    `cart_id` VARCHAR(32) NOT NULL,
    `variant_id` VARCHAR(32) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_cart_items_variant`(`variant_id`),
    UNIQUE INDEX `uq_cart_items_cart_variant`(`cart_id`, `variant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favorites` (
    `id` VARCHAR(32) NOT NULL,
    `user_id` VARCHAR(32) NOT NULL,
    `product_id` VARCHAR(32) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_favorites_product`(`product_id`),
    UNIQUE INDEX `uq_favorites_user_product`(`user_id`, `product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coupons` (
    `id` VARCHAR(32) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `type` ENUM('PERCENT', 'FIXED') NOT NULL,
    `value` DECIMAL(12, 2) NOT NULL,
    `min_order_value` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `max_discount` DECIMAL(12, 2) NULL,
    `start_at` DATETIME(3) NOT NULL,
    `end_at` DATETIME(3) NOT NULL,
    `usage_limit` INTEGER NULL,
    `per_user_limit` INTEGER NULL,
    `used_count` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `uq_coupons_code`(`code`),
    INDEX `idx_coupons_code_active`(`code`, `is_active`),
    INDEX `idx_coupons_active_window`(`is_active`, `start_at`, `end_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(32) NOT NULL,
    `user_id` VARCHAR(32) NOT NULL,
    `coupon_id` VARCHAR(32) NULL,
    `order_code` VARCHAR(40) NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `payment_method` ENUM('COD', 'VNPAY', 'MOMO') NOT NULL,
    `payment_status` ENUM('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'UNPAID',
    `receiver_name` VARCHAR(100) NOT NULL,
    `receiver_phone` VARCHAR(20) NOT NULL,
    `receiver_email` VARCHAR(254) NULL,
    `address_line_1` VARCHAR(255) NOT NULL,
    `address_line_2` VARCHAR(255) NULL,
    `ward` VARCHAR(100) NOT NULL,
    `district` VARCHAR(100) NOT NULL,
    `province` VARCHAR(100) NOT NULL,
    `postal_code` VARCHAR(20) NULL,
    `coupon_code` VARCHAR(50) NULL,
    `note` VARCHAR(500) NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `discount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `shipping_fee` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(12, 2) NOT NULL,
    `paid_at` DATETIME(3) NULL,
    `delivered_at` DATETIME(3) NULL,
    `cancelled_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uq_orders_order_code`(`order_code`),
    INDEX `idx_orders_user_created`(`user_id`, `created_at`),
    INDEX `idx_orders_status_created`(`status`, `created_at`),
    INDEX `idx_orders_payment_status_created`(`payment_status`, `created_at`),
    INDEX `idx_orders_created_at`(`created_at`),
    INDEX `idx_orders_delivered_at`(`delivered_at`),
    INDEX `idx_orders_receiver_phone`(`receiver_phone`),
    INDEX `idx_orders_coupon`(`coupon_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` VARCHAR(32) NOT NULL,
    `order_id` VARCHAR(32) NOT NULL,
    `product_id` VARCHAR(32) NULL,
    `variant_id` VARCHAR(32) NULL,
    `product_name` VARCHAR(200) NOT NULL,
    `sku` VARCHAR(64) NOT NULL,
    `size` VARCHAR(50) NOT NULL,
    `color` VARCHAR(100) NOT NULL,
    `image_url` VARCHAR(2048) NULL,
    `unit_price` DECIMAL(12, 2) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_order_items_order`(`order_id`),
    INDEX `idx_order_items_product`(`product_id`),
    INDEX `idx_order_items_variant`(`variant_id`),
    INDEX `idx_order_items_sku`(`sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_status_history` (
    `id` VARCHAR(32) NOT NULL,
    `order_id` VARCHAR(32) NOT NULL,
    `actor_id` VARCHAR(32) NULL,
    `from_status` ENUM('PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED') NULL,
    `to_status` ENUM('PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED') NOT NULL,
    `note` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_order_status_history_order_created`(`order_id`, `created_at`),
    INDEX `idx_order_status_history_actor`(`actor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coupon_redemptions` (
    `id` VARCHAR(32) NOT NULL,
    `coupon_id` VARCHAR(32) NOT NULL,
    `user_id` VARCHAR(32) NOT NULL,
    `order_id` VARCHAR(32) NOT NULL,
    `status` ENUM('APPLIED', 'RELEASED') NOT NULL DEFAULT 'APPLIED',
    `discount_amount` DECIMAL(12, 2) NOT NULL,
    `applied_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `released_at` DATETIME(3) NULL,

    UNIQUE INDEX `uq_coupon_redemptions_order`(`order_id`),
    INDEX `idx_coupon_redemptions_coupon_status`(`coupon_id`, `status`),
    INDEX `idx_coupon_redemptions_coupon_user_status`(`coupon_id`, `user_id`, `status`),
    INDEX `idx_coupon_redemptions_user`(`user_id`),
    UNIQUE INDEX `uq_coupon_redemptions_coupon_order`(`coupon_id`, `order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `checkout_idempotencies` (
    `id` VARCHAR(32) NOT NULL,
    `user_id` VARCHAR(32) NOT NULL,
    `idempotency_key` VARCHAR(64) NOT NULL,
    `request_hash` CHAR(64) NOT NULL,
    `status` ENUM('IN_PROGRESS', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'IN_PROGRESS',
    `order_id` VARCHAR(32) NULL,
    `response_status` SMALLINT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uq_checkout_idempotencies_order`(`order_id`),
    INDEX `idx_checkout_idempotencies_expires_at`(`expires_at`),
    UNIQUE INDEX `uq_checkout_idempotencies_user_key`(`user_id`, `idempotency_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(32) NOT NULL,
    `order_id` VARCHAR(32) NOT NULL,
    `provider` ENUM('COD', 'VNPAY', 'MOMO') NOT NULL,
    `provider_transaction_id` VARCHAR(255) NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'VND',
    `status` ENUM('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `metadata` JSON NULL,
    `paid_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_payments_order_created`(`order_id`, `created_at`),
    INDEX `idx_payments_status_created`(`status`, `created_at`),
    UNIQUE INDEX `uq_payments_provider_transaction`(`provider`, `provider_transaction_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_transactions` (
    `id` VARCHAR(32) NOT NULL,
    `variant_id` VARCHAR(32) NOT NULL,
    `order_id` VARCHAR(32) NULL,
    `order_item_id` VARCHAR(32) NULL,
    `created_by_id` VARCHAR(32) NULL,
    `type` ENUM('IMPORT', 'SALE', 'CANCEL_RETURN', 'MANUAL_ADJUSTMENT', 'RETURN') NOT NULL,
    `quantity_delta` INTEGER NOT NULL,
    `stock_before` INTEGER NOT NULL,
    `stock_after` INTEGER NOT NULL,
    `reference` VARCHAR(100) NULL,
    `reason` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_inventory_transactions_variant_created`(`variant_id`, `created_at`),
    INDEX `idx_inventory_transactions_order`(`order_id`),
    INDEX `idx_inventory_transactions_order_item`(`order_item_id`),
    INDEX `idx_inventory_transactions_type_created`(`type`, `created_at`),
    INDEX `idx_inventory_transactions_reference`(`reference`),
    INDEX `idx_inventory_transactions_actor`(`created_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` VARCHAR(32) NOT NULL,
    `user_id` VARCHAR(32) NOT NULL,
    `product_id` VARCHAR(32) NOT NULL,
    `order_item_id` VARCHAR(32) NOT NULL,
    `rating` INTEGER NOT NULL,
    `title` VARCHAR(150) NULL,
    `content` TEXT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'HIDDEN') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `uq_reviews_order_item`(`order_item_id`),
    INDEX `idx_reviews_product_status_created`(`product_id`, `status`, `created_at`),
    INDEX `idx_reviews_product_rating`(`product_id`, `rating`),
    INDEX `idx_reviews_user_created`(`user_id`, `created_at`),
    UNIQUE INDEX `uq_reviews_user_product`(`user_id`, `product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `refresh_sessions` ADD CONSTRAINT `refresh_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_sessions` ADD CONSTRAINT `refresh_sessions_replaced_by_id_fkey` FOREIGN KEY (`replaced_by_id`) REFERENCES `refresh_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `upload_assets` ADD CONSTRAINT `upload_assets_uploaded_by_id_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `upload_assets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_size_id_fkey` FOREIGN KEY (`size_id`) REFERENCES `sizes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_color_id_fkey` FOREIGN KEY (`color_id`) REFERENCES `colors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carts` ADD CONSTRAINT `carts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_cart_id_fkey` FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_coupon_id_fkey` FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_status_history` ADD CONSTRAINT `order_status_history_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_status_history` ADD CONSTRAINT `order_status_history_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coupon_redemptions` ADD CONSTRAINT `coupon_redemptions_coupon_id_fkey` FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coupon_redemptions` ADD CONSTRAINT `coupon_redemptions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coupon_redemptions` ADD CONSTRAINT `coupon_redemptions_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `checkout_idempotencies` ADD CONSTRAINT `checkout_idempotencies_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `checkout_idempotencies` ADD CONSTRAINT `checkout_idempotencies_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_order_item_id_fkey` FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_order_item_id_fkey` FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Business invariant checks maintained alongside the initial migration.
ALTER TABLE `products`
  ADD CONSTRAINT `chk_products_base_price_non_negative` CHECK (`base_price` >= 0),
  ADD CONSTRAINT `chk_products_sale_price_valid` CHECK (`sale_price` IS NULL OR (`sale_price` >= 0 AND `sale_price` <= `base_price`));

ALTER TABLE `upload_assets`
  ADD CONSTRAINT `chk_upload_assets_dimensions_positive` CHECK ((`width` IS NULL OR `width` > 0) AND (`height` IS NULL OR `height` > 0)),
  ADD CONSTRAINT `chk_upload_assets_bytes_positive` CHECK (`bytes` > 0);

ALTER TABLE `product_variants`
  ADD CONSTRAINT `chk_product_variants_stock_non_negative` CHECK (`stock` >= 0),
  ADD CONSTRAINT `chk_product_variants_price_non_negative` CHECK (`price` IS NULL OR `price` >= 0),
  ADD CONSTRAINT `chk_product_variants_sale_price_non_negative` CHECK (`sale_price` IS NULL OR `sale_price` >= 0),
  ADD CONSTRAINT `chk_product_variants_sale_not_above_price` CHECK (`sale_price` IS NULL OR `price` IS NULL OR `sale_price` <= `price`);

ALTER TABLE `cart_items`
  ADD CONSTRAINT `chk_cart_items_quantity_positive` CHECK (`quantity` >= 1);

ALTER TABLE `coupons`
  ADD CONSTRAINT `chk_coupons_value_positive` CHECK (`value` > 0),
  ADD CONSTRAINT `chk_coupons_min_order_non_negative` CHECK (`min_order_value` >= 0),
  ADD CONSTRAINT `chk_coupons_max_discount_positive` CHECK (`max_discount` IS NULL OR `max_discount` > 0),
  ADD CONSTRAINT `chk_coupons_valid_window` CHECK (`end_at` > `start_at`),
  ADD CONSTRAINT `chk_coupons_limits_positive` CHECK ((`usage_limit` IS NULL OR `usage_limit` > 0) AND (`per_user_limit` IS NULL OR `per_user_limit` > 0)),
  ADD CONSTRAINT `chk_coupons_used_count_valid` CHECK (`used_count` >= 0 AND (`usage_limit` IS NULL OR `used_count` <= `usage_limit`)),
  ADD CONSTRAINT `chk_coupons_percent_value_valid` CHECK (`type` <> 'PERCENT' OR `value` <= 100);

ALTER TABLE `orders`
  ADD CONSTRAINT `chk_orders_money_non_negative` CHECK (`subtotal` >= 0 AND `discount` >= 0 AND `shipping_fee` >= 0 AND `total` >= 0),
  ADD CONSTRAINT `chk_orders_discount_not_above_subtotal` CHECK (`discount` <= `subtotal`),
  ADD CONSTRAINT `chk_orders_total_formula` CHECK (`total` = (`subtotal` - `discount` + `shipping_fee`));

ALTER TABLE `order_items`
  ADD CONSTRAINT `chk_order_items_price_non_negative` CHECK (`unit_price` >= 0 AND `subtotal` >= 0),
  ADD CONSTRAINT `chk_order_items_quantity_positive` CHECK (`quantity` >= 1),
  ADD CONSTRAINT `chk_order_items_subtotal_formula` CHECK (`subtotal` = (`unit_price` * `quantity`));

ALTER TABLE `coupon_redemptions`
  ADD CONSTRAINT `chk_coupon_redemptions_discount_non_negative` CHECK (`discount_amount` >= 0);

ALTER TABLE `payments`
  ADD CONSTRAINT `chk_payments_amount_non_negative` CHECK (`amount` >= 0);

ALTER TABLE `inventory_transactions`
  ADD CONSTRAINT `chk_inventory_stocks_non_negative` CHECK (`stock_before` >= 0 AND `stock_after` >= 0),
  ADD CONSTRAINT `chk_inventory_delta_non_zero` CHECK (`quantity_delta` <> 0),
  ADD CONSTRAINT `chk_inventory_balance` CHECK (`stock_after` = (`stock_before` + `quantity_delta`)),
  ADD CONSTRAINT `chk_inventory_direction` CHECK (
    (`type` = 'SALE' AND `quantity_delta` < 0)
    OR (`type` IN ('IMPORT', 'CANCEL_RETURN', 'RETURN') AND `quantity_delta` > 0)
    OR (`type` = 'MANUAL_ADJUSTMENT' AND `quantity_delta` <> 0)
  );

ALTER TABLE `reviews`
  ADD CONSTRAINT `chk_reviews_rating_range` CHECK (`rating` BETWEEN 1 AND 5);

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_tenants` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `cnpj` VARCHAR(20) NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NULL,
    `website` VARCHAR(255) NULL,
    `country` VARCHAR(100) NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(2) NULL,
    `zip_code` VARCHAR(10) NULL,
    `street` VARCHAR(255) NULL,
    `number` VARCHAR(20) NULL,
    `district` VARCHAR(100) NULL,
    `complement` VARCHAR(255) NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `name` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `cpf` VARCHAR(20) NULL,
    `password_hash` VARCHAR(255) NULL,
    `two_factor_enabled` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('active', 'inactive', 'blocked') NOT NULL DEFAULT 'active',
    `last_login_at` DATETIME(3) NULL,
    `last_password_change` DATETIME(3) NULL,
    `token_version` INTEGER NOT NULL DEFAULT 0,
    `refresh_token_hash` VARCHAR(255) NULL,
    `refresh_token_expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `partido_users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_people` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `user_id` BIGINT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NULL,
    `cpf_hash` VARCHAR(64) NULL,
    `cpf_encrypted` TEXT NULL,
    `cpf_key_version` INTEGER NOT NULL DEFAULT 1,
    `type` ENUM('filiado', 'fornecedor', 'funcionario', 'candidato', 'doador', 'voluntario') NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `birthdate` DATE NULL,
    `address` VARCHAR(255) NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(2) NULL,
    `zip_code` VARCHAR(10) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `partido_people_user_id_key`(`user_id`),
    INDEX `partido_people_tenant_id_idx`(`tenant_id`),
    INDEX `partido_people_tenant_id_name_idx`(`tenant_id`, `name`),
    INDEX `partido_people_tenant_id_status_idx`(`tenant_id`, `status`),
    INDEX `partido_people_tenant_id_type_idx`(`tenant_id`, `type`),
    INDEX `partido_people_tenant_id_deleted_at_idx`(`tenant_id`, `deleted_at`),
    UNIQUE INDEX `partido_people_tenant_id_cpf_hash_key`(`tenant_id`, `cpf_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_roles` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `partido_roles_tenant_id_name_key`(`tenant_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_permissions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `key_name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,

    UNIQUE INDEX `partido_permissions_tenant_id_key_name_key`(`tenant_id`, `key_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_role_permissions` (
    `role_id` BIGINT NOT NULL,
    `permission_id` BIGINT NOT NULL,

    PRIMARY KEY (`role_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_user_roles` (
    `user_id` BIGINT NOT NULL,
    `role_id` BIGINT NOT NULL,

    PRIMARY KEY (`user_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_audit_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NULL,
    `user_id` BIGINT NULL,
    `action` VARCHAR(255) NOT NULL,
    `entity` VARCHAR(100) NULL,
    `entity_id` BIGINT NULL,
    `metadata` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_transactions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `person_id` BIGINT NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `type` ENUM('income', 'expense') NOT NULL,
    `status` ENUM('draft', 'pending_approval', 'approved', 'paid', 'overdue', 'cancelled') NOT NULL DEFAULT 'draft',
    `context` ENUM('diretorio', 'partidario', 'campanha') NOT NULL DEFAULT 'diretorio',
    `origin` ENUM('manual', 'recurring', 'donation', 'contribution', 'imported') NOT NULL DEFAULT 'manual',
    `category_id` BIGINT NOT NULL,
    `cost_center_id` BIGINT NULL,
    `campaign_id` BIGINT NULL,
    `competency_month` INTEGER NOT NULL,
    `competency_year` INTEGER NOT NULL,
    `due_date` DATE NOT NULL,
    `paid_at` DATE NULL,
    `notes` TEXT NULL,
    `attachments_count` INTEGER NOT NULL DEFAULT 0,
    `recurring_transaction_id` BIGINT NULL,
    `created_by` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `partido_transactions_tenant_id_idx`(`tenant_id`),
    INDEX `partido_transactions_tenant_id_status_idx`(`tenant_id`, `status`),
    INDEX `partido_transactions_tenant_id_type_idx`(`tenant_id`, `type`),
    INDEX `partido_transactions_tenant_id_context_idx`(`tenant_id`, `context`),
    INDEX `partido_transactions_tenant_id_due_date_idx`(`tenant_id`, `due_date`),
    INDEX `partido_transactions_tenant_id_due_date_status_idx`(`tenant_id`, `due_date`, `status`),
    INDEX `partido_transactions_tenant_id_person_id_idx`(`tenant_id`, `person_id`),
    INDEX `partido_transactions_tenant_id_category_id_idx`(`tenant_id`, `category_id`),
    INDEX `partido_transactions_tenant_id_cost_center_id_idx`(`tenant_id`, `cost_center_id`),
    INDEX `partido_transactions_tenant_id_competency_year_competency_mo_idx`(`tenant_id`, `competency_year`, `competency_month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_transaction_status_history` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `transaction_id` BIGINT NOT NULL,
    `tenant_id` BIGINT NOT NULL,
    `from_status` ENUM('draft', 'pending_approval', 'approved', 'paid', 'overdue', 'cancelled') NULL,
    `to_status` ENUM('draft', 'pending_approval', 'approved', 'paid', 'overdue', 'cancelled') NOT NULL,
    `changed_by` BIGINT NOT NULL,
    `reason` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `partido_transaction_status_history_transaction_id_idx`(`transaction_id`),
    INDEX `partido_transaction_status_history_tenant_id_idx`(`tenant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_transaction_approvals` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `transaction_id` BIGINT NOT NULL,
    `tenant_id` BIGINT NOT NULL,
    `step_order` INTEGER NOT NULL,
    `required_role` VARCHAR(100) NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `acted_by` BIGINT NULL,
    `reason` TEXT NULL,
    `acted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `partido_transaction_approvals_transaction_id_idx`(`transaction_id`),
    INDEX `partido_transaction_approvals_tenant_id_status_idx`(`tenant_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_financial_period_closings` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `status` ENUM('open', 'closed') NOT NULL DEFAULT 'open',
    `closed_by` BIGINT NULL,
    `closed_at` DATETIME(3) NULL,
    `reopened_by` BIGINT NULL,
    `reopened_at` DATETIME(3) NULL,
    `reopen_reason` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `partido_financial_period_closings_tenant_id_idx`(`tenant_id`),
    INDEX `partido_financial_period_closings_tenant_id_status_idx`(`tenant_id`, `status`),
    UNIQUE INDEX `partido_financial_period_closings_tenant_id_year_month_key`(`tenant_id`, `year`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_recurring_transactions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `person_id` BIGINT NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `type` ENUM('income', 'expense') NOT NULL,
    `context` ENUM('diretorio', 'partidario', 'campanha') NOT NULL DEFAULT 'diretorio',
    `category_id` BIGINT NOT NULL,
    `cost_center_id` BIGINT NULL,
    `campaign_id` BIGINT NULL,
    `day_of_month` INTEGER NOT NULL,
    `start_month` INTEGER NOT NULL,
    `start_year` INTEGER NOT NULL,
    `end_month` INTEGER NULL,
    `end_year` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `notes` TEXT NULL,
    `created_by` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `partido_recurring_transactions_tenant_id_idx`(`tenant_id`),
    INDEX `partido_recurring_transactions_tenant_id_is_active_idx`(`tenant_id`, `is_active`),
    INDEX `partido_recurring_transactions_tenant_id_person_id_idx`(`tenant_id`, `person_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_contributions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `person_id` BIGINT NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `frequency` ENUM('monthly', 'quarterly', 'annual') NOT NULL,
    `status` ENUM('active', 'suspended', 'cancelled') NOT NULL DEFAULT 'active',
    `start_date` DATE NOT NULL,
    `end_date` DATE NULL,
    `notes` TEXT NULL,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `partido_contributions_tenant_id_idx`(`tenant_id`),
    INDEX `partido_contributions_tenant_id_status_idx`(`tenant_id`, `status`),
    INDEX `partido_contributions_tenant_id_person_id_idx`(`tenant_id`, `person_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_contribution_payments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `contribution_id` BIGINT NOT NULL,
    `tenant_id` BIGINT NOT NULL,
    `reference_month` VARCHAR(7) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `amount_paid` DECIMAL(12, 2) NULL,
    `status` ENUM('pending', 'paid', 'overdue') NOT NULL DEFAULT 'pending',
    `due_date` DATE NOT NULL,
    `paid_at` DATE NULL,
    `payment_method` ENUM('pix', 'bank_transfer', 'cash', 'boleto', 'card') NULL,
    `notes` TEXT NULL,
    `created_by` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `partido_contribution_payments_tenant_id_idx`(`tenant_id`),
    INDEX `partido_contribution_payments_contribution_id_idx`(`contribution_id`),
    INDEX `partido_contribution_payments_tenant_id_status_idx`(`tenant_id`, `status`),
    INDEX `partido_contribution_payments_tenant_id_due_date_idx`(`tenant_id`, `due_date`),
    UNIQUE INDEX `partido_contribution_payments_contribution_id_reference_mont_key`(`contribution_id`, `reference_month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_documents` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` ENUM('ata', 'contrato', 'pessoal', 'financeiro', 'procuracao', 'declaracao', 'estatuto', 'regimento', 'pesquisa') NOT NULL,
    `entity_type` ENUM('people', 'financial', 'campaign', 'general', 'election', 'mandate', 'chapter', 'organ', 'contract') NOT NULL,
    `entity_id` BIGINT NULL,
    `current_version_id` BIGINT NULL,
    `is_signed` BOOLEAN NOT NULL DEFAULT false,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `partido_documents_tenant_id_idx`(`tenant_id`),
    INDEX `partido_documents_tenant_id_entity_type_entity_id_idx`(`tenant_id`, `entity_type`, `entity_id`),
    INDEX `partido_documents_tenant_id_type_idx`(`tenant_id`, `type`),
    INDEX `partido_documents_tenant_id_deleted_at_idx`(`tenant_id`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_document_versions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `document_id` BIGINT NOT NULL,
    `version` INTEGER NOT NULL,
    `file_url` VARCHAR(2048) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `size` INTEGER NOT NULL,
    `is_signed` BOOLEAN NOT NULL DEFAULT false,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `partido_document_versions_document_id_idx`(`document_id`),
    UNIQUE INDEX `partido_document_versions_document_id_version_key`(`document_id`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_cost_centers` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_by` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `partido_cost_centers_tenant_id_idx`(`tenant_id`),
    INDEX `partido_cost_centers_tenant_id_is_active_idx`(`tenant_id`, `is_active`),
    INDEX `partido_cost_centers_tenant_id_name_idx`(`tenant_id`, `name`),
    UNIQUE INDEX `partido_cost_centers_tenant_id_code_key`(`tenant_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_financial_categories` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `type` ENUM('income', 'expense', 'both') NOT NULL,
    `parent_id` BIGINT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_by` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `partido_financial_categories_tenant_id_idx`(`tenant_id`),
    INDEX `partido_financial_categories_tenant_id_type_idx`(`tenant_id`, `type`),
    INDEX `partido_financial_categories_tenant_id_is_active_idx`(`tenant_id`, `is_active`),
    INDEX `partido_financial_categories_parent_id_idx`(`parent_id`),
    UNIQUE INDEX `partido_financial_categories_tenant_id_name_type_key`(`tenant_id`, `name`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_crm_tags` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `color` VARCHAR(7) NOT NULL,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    INDEX `partido_crm_tags_tenant_id_idx`(`tenant_id`),
    UNIQUE INDEX `partido_crm_tags_tenant_id_name_key`(`tenant_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_crm_people_tags` (
    `person_id` BIGINT NOT NULL,
    `tag_id` BIGINT NOT NULL,
    `tenant_id` BIGINT NOT NULL,

    INDEX `partido_crm_people_tags_tenant_id_idx`(`tenant_id`),
    INDEX `partido_crm_people_tags_tag_id_idx`(`tag_id`),
    PRIMARY KEY (`person_id`, `tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_crm_pipeline_stages` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `color` VARCHAR(7) NOT NULL,
    `order` INTEGER NOT NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `is_final` BOOLEAN NOT NULL DEFAULT false,
    `target_people_type` VARCHAR(50) NULL,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `partido_crm_pipeline_stages_tenant_id_idx`(`tenant_id`),
    INDEX `partido_crm_pipeline_stages_tenant_id_order_idx`(`tenant_id`, `order`),
    UNIQUE INDEX `partido_crm_pipeline_stages_tenant_id_name_key`(`tenant_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_crm_pipeline_entries` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `person_id` BIGINT NOT NULL,
    `stage_id` BIGINT NOT NULL,
    `entered_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `exited_at` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `partido_crm_pipeline_entries_tenant_id_person_id_idx`(`tenant_id`, `person_id`),
    INDEX `partido_crm_pipeline_entries_tenant_id_stage_id_idx`(`tenant_id`, `stage_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_crm_interactions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `person_id` BIGINT NOT NULL,
    `type` ENUM('call', 'email', 'whatsapp', 'meeting', 'visit', 'other') NOT NULL,
    `direction` ENUM('inbound', 'outbound') NOT NULL,
    `summary` TEXT NOT NULL,
    `occurred_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    INDEX `partido_crm_interactions_tenant_id_person_id_idx`(`tenant_id`, `person_id`),
    INDEX `partido_crm_interactions_tenant_id_occurred_at_idx`(`tenant_id`, `occurred_at`),
    INDEX `partido_crm_interactions_tenant_id_type_idx`(`tenant_id`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_crm_tasks` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `person_id` BIGINT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `due_date` DATE NOT NULL,
    `status` ENUM('pending', 'in_progress', 'done', 'cancelled') NOT NULL DEFAULT 'pending',
    `priority` ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    `assigned_to` BIGINT NOT NULL,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `partido_crm_tasks_tenant_id_assigned_to_status_idx`(`tenant_id`, `assigned_to`, `status`),
    INDEX `partido_crm_tasks_tenant_id_due_date_status_idx`(`tenant_id`, `due_date`, `status`),
    INDEX `partido_crm_tasks_tenant_id_person_id_idx`(`tenant_id`, `person_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_crm_notifications` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `type` ENUM('task_assigned', 'task_overdue', 'pipeline_moved', 'event_reminder') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `entity_type` VARCHAR(50) NULL,
    `entity_id` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `partido_crm_notifications_tenant_id_user_id_read_idx`(`tenant_id`, `user_id`, `read`),
    INDEX `partido_crm_notifications_tenant_id_user_id_idx`(`tenant_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_crm_events` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `location` VARCHAR(255) NULL,
    `start_at` DATETIME(3) NOT NULL,
    `end_at` DATETIME(3) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `partido_crm_events_tenant_id_start_at_idx`(`tenant_id`, `start_at`),
    INDEX `partido_crm_events_tenant_id_is_active_idx`(`tenant_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_crm_event_attendances` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `event_id` BIGINT NOT NULL,
    `person_id` BIGINT NOT NULL,
    `tenant_id` BIGINT NOT NULL,
    `status` ENUM('invited', 'confirmed', 'attended', 'absent') NOT NULL DEFAULT 'invited',
    `registered_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `partido_crm_event_attendances_event_id_idx`(`event_id`),
    INDEX `partido_crm_event_attendances_tenant_id_person_id_idx`(`tenant_id`, `person_id`),
    UNIQUE INDEX `partido_crm_event_attendances_event_id_person_id_key`(`event_id`, `person_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_crm_device_tokens` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `token` VARCHAR(512) NOT NULL,
    `platform` VARCHAR(20) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `partido_crm_device_tokens_user_id_idx`(`user_id`),
    UNIQUE INDEX `partido_crm_device_tokens_user_id_token_key`(`user_id`, `token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_crm_imports` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `filename` VARCHAR(255) NOT NULL,
    `status` ENUM('processing', 'done', 'failed') NOT NULL DEFAULT 'processing',
    `total` INTEGER NOT NULL DEFAULT 0,
    `imported` INTEGER NOT NULL DEFAULT 0,
    `skipped` INTEGER NOT NULL DEFAULT 0,
    `errors` JSON NULL,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `partido_crm_imports_tenant_id_idx`(`tenant_id`),
    INDEX `partido_crm_imports_tenant_id_status_idx`(`tenant_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_elections` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `year` INTEGER NOT NULL,
    `scope` ENUM('municipal', 'estadual', 'federal', 'distrital') NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `election_date` DATE NULL,
    `runoff_date` DATE NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `partido_elections_tenant_id_year_idx`(`tenant_id`, `year`),
    INDEX `partido_elections_tenant_id_scope_idx`(`tenant_id`, `scope`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_campaigns` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `election_id` BIGINT NOT NULL,
    `person_id` BIGINT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `position` VARCHAR(100) NOT NULL,
    `number` VARCHAR(20) NULL,
    `status` ENUM('planning', 'active', 'suspended', 'finished') NOT NULL DEFAULT 'planning',
    `budget_limit` DECIMAL(14, 2) NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `description` TEXT NULL,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `partido_campaigns_tenant_id_election_id_idx`(`tenant_id`, `election_id`),
    INDEX `partido_campaigns_tenant_id_status_idx`(`tenant_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_campaign_team` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `campaign_id` BIGINT NOT NULL,
    `person_id` BIGINT NOT NULL,
    `role` ENUM('coordenador_geral', 'coordenador_area', 'assessor', 'cabo_eleitoral', 'voluntario', 'motorista', 'seguranca', 'comunicacao', 'juridico', 'financeiro', 'outros') NOT NULL,
    `payment_type` ENUM('voluntario', 'remunerado', 'prestador') NOT NULL DEFAULT 'voluntario',
    `salary` DECIMAL(12, 2) NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NULL,
    `notes` TEXT NULL,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `partido_campaign_team_tenant_id_campaign_id_idx`(`tenant_id`, `campaign_id`),
    UNIQUE INDEX `partido_campaign_team_campaign_id_person_id_key`(`campaign_id`, `person_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_campaign_contracts` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `campaign_id` BIGINT NOT NULL,
    `person_id` BIGINT NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `object` TEXT NOT NULL,
    `value` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('draft', 'active', 'completed', 'cancelled') NOT NULL DEFAULT 'draft',
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `tse_code` VARCHAR(20) NULL,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `partido_campaign_contracts_tenant_id_campaign_id_idx`(`tenant_id`, `campaign_id`),
    INDEX `partido_campaign_contracts_tenant_id_status_idx`(`tenant_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_campaign_contract_payments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `contract_id` BIGINT NOT NULL,
    `transaction_id` BIGINT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `due_date` DATE NOT NULL,
    `paid_at` DATE NULL,
    `notes` TEXT NULL,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `partido_campaign_contract_payments_tenant_id_contract_id_idx`(`tenant_id`, `contract_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_campaign_schedule` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `campaign_id` BIGINT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `type` ENUM('comicio', 'caminhada', 'reuniao', 'corpo_a_corpo', 'entrevista', 'debate', 'panfletagem', 'visita', 'evento_social', 'outro') NOT NULL,
    `status` ENUM('planned', 'confirmed', 'done', 'cancelled') NOT NULL DEFAULT 'planned',
    `location` VARCHAR(255) NULL,
    `start_at` DATETIME(3) NOT NULL,
    `end_at` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `partido_campaign_schedule_tenant_id_campaign_id_idx`(`tenant_id`, `campaign_id`),
    INDEX `partido_campaign_schedule_tenant_id_start_at_idx`(`tenant_id`, `start_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_tse_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(20) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `type` VARCHAR(10) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `partido_tse_codes_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_tse_reports` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `campaign_id` BIGINT NOT NULL,
    `type` ENUM('parcial', 'final', 'suplementar') NOT NULL,
    `status` ENUM('draft', 'submitted', 'approved', 'rejected', 'rectified') NOT NULL DEFAULT 'draft',
    `reference` VARCHAR(50) NOT NULL,
    `period_start` DATE NOT NULL,
    `period_end` DATE NOT NULL,
    `submitted_at` DATETIME(3) NULL,
    `tse_protocol` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `partido_tse_reports_tenant_id_campaign_id_idx`(`tenant_id`, `campaign_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_tse_report_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `report_id` BIGINT NOT NULL,
    `transaction_id` BIGINT NOT NULL,
    `tse_code_id` INTEGER NOT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `partido_tse_report_items_report_id_idx`(`report_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_party_chapters` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `level` ENUM('nacional', 'estadual', 'municipal', 'zonal', 'setorial') NOT NULL,
    `state` VARCHAR(2) NULL,
    `city` VARCHAR(100) NULL,
    `zone` VARCHAR(100) NULL,
    `parent_id` BIGINT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `partido_party_chapters_tenant_id_level_idx`(`tenant_id`, `level`),
    INDEX `partido_party_chapters_tenant_id_parent_id_idx`(`tenant_id`, `parent_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_chapter_members` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `chapter_id` BIGINT NOT NULL,
    `person_id` BIGINT NOT NULL,
    `tenant_id` BIGINT NOT NULL,
    `role` VARCHAR(100) NULL,
    `joined_at` DATE NOT NULL,
    `left_at` DATE NULL,

    INDEX `partido_chapter_members_tenant_id_idx`(`tenant_id`),
    UNIQUE INDEX `partido_chapter_members_chapter_id_person_id_key`(`chapter_id`, `person_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_party_organs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `partido_party_organs_tenant_id_idx`(`tenant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_organ_members` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `organ_id` BIGINT NOT NULL,
    `person_id` BIGINT NOT NULL,
    `tenant_id` BIGINT NOT NULL,
    `role` VARCHAR(100) NULL,
    `joined_at` DATE NOT NULL,
    `left_at` DATE NULL,

    INDEX `partido_organ_members_tenant_id_idx`(`tenant_id`),
    UNIQUE INDEX `partido_organ_members_organ_id_person_id_key`(`organ_id`, `person_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `partido_mandates` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenant_id` BIGINT NOT NULL,
    `person_id` BIGINT NOT NULL,
    `campaign_id` BIGINT NULL,
    `position` VARCHAR(100) NOT NULL,
    `jurisdiction` VARCHAR(255) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NULL,
    `status` ENUM('active', 'finished', 'renounced', 'revoked', 'suspended') NOT NULL DEFAULT 'active',
    `notes` TEXT NULL,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `partido_mandates_tenant_id_person_id_idx`(`tenant_id`, `person_id`),
    INDEX `partido_mandates_tenant_id_status_idx`(`tenant_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `partido_users` ADD CONSTRAINT `partido_users_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_people` ADD CONSTRAINT `partido_people_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_people` ADD CONSTRAINT `partido_people_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `partido_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_roles` ADD CONSTRAINT `partido_roles_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_permissions` ADD CONSTRAINT `partido_permissions_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_role_permissions` ADD CONSTRAINT `partido_role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `partido_roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_role_permissions` ADD CONSTRAINT `partido_role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `partido_permissions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_user_roles` ADD CONSTRAINT `partido_user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `partido_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_user_roles` ADD CONSTRAINT `partido_user_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `partido_roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_audit_logs` ADD CONSTRAINT `partido_audit_logs_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_audit_logs` ADD CONSTRAINT `partido_audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `partido_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_transactions` ADD CONSTRAINT `partido_transactions_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_transactions` ADD CONSTRAINT `partido_transactions_person_id_fkey` FOREIGN KEY (`person_id`) REFERENCES `partido_people`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_transactions` ADD CONSTRAINT `partido_transactions_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `partido_financial_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_transactions` ADD CONSTRAINT `partido_transactions_cost_center_id_fkey` FOREIGN KEY (`cost_center_id`) REFERENCES `partido_cost_centers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_transactions` ADD CONSTRAINT `partido_transactions_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `partido_campaigns`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_transaction_status_history` ADD CONSTRAINT `partido_transaction_status_history_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `partido_transactions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_transaction_approvals` ADD CONSTRAINT `partido_transaction_approvals_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `partido_transactions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_financial_period_closings` ADD CONSTRAINT `partido_financial_period_closings_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_recurring_transactions` ADD CONSTRAINT `partido_recurring_transactions_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_recurring_transactions` ADD CONSTRAINT `partido_recurring_transactions_person_id_fkey` FOREIGN KEY (`person_id`) REFERENCES `partido_people`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_recurring_transactions` ADD CONSTRAINT `partido_recurring_transactions_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `partido_financial_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_recurring_transactions` ADD CONSTRAINT `partido_recurring_transactions_cost_center_id_fkey` FOREIGN KEY (`cost_center_id`) REFERENCES `partido_cost_centers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_recurring_transactions` ADD CONSTRAINT `partido_recurring_transactions_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `partido_campaigns`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_contributions` ADD CONSTRAINT `partido_contributions_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_contributions` ADD CONSTRAINT `partido_contributions_person_id_fkey` FOREIGN KEY (`person_id`) REFERENCES `partido_people`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_contribution_payments` ADD CONSTRAINT `partido_contribution_payments_contribution_id_fkey` FOREIGN KEY (`contribution_id`) REFERENCES `partido_contributions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_documents` ADD CONSTRAINT `partido_documents_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_documents` ADD CONSTRAINT `partido_documents_current_version_id_fkey` FOREIGN KEY (`current_version_id`) REFERENCES `partido_document_versions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_document_versions` ADD CONSTRAINT `partido_document_versions_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `partido_documents`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_cost_centers` ADD CONSTRAINT `partido_cost_centers_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_financial_categories` ADD CONSTRAINT `partido_financial_categories_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_financial_categories` ADD CONSTRAINT `partido_financial_categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `partido_financial_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_crm_tags` ADD CONSTRAINT `partido_crm_tags_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_crm_people_tags` ADD CONSTRAINT `partido_crm_people_tags_person_id_fkey` FOREIGN KEY (`person_id`) REFERENCES `partido_people`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_crm_people_tags` ADD CONSTRAINT `partido_crm_people_tags_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `partido_crm_tags`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_crm_people_tags` ADD CONSTRAINT `partido_crm_people_tags_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_crm_pipeline_stages` ADD CONSTRAINT `partido_crm_pipeline_stages_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_crm_pipeline_entries` ADD CONSTRAINT `partido_crm_pipeline_entries_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_crm_pipeline_entries` ADD CONSTRAINT `partido_crm_pipeline_entries_person_id_fkey` FOREIGN KEY (`person_id`) REFERENCES `partido_people`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_crm_pipeline_entries` ADD CONSTRAINT `partido_crm_pipeline_entries_stage_id_fkey` FOREIGN KEY (`stage_id`) REFERENCES `partido_crm_pipeline_stages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_crm_interactions` ADD CONSTRAINT `partido_crm_interactions_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_crm_interactions` ADD CONSTRAINT `partido_crm_interactions_person_id_fkey` FOREIGN KEY (`person_id`) REFERENCES `partido_people`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_crm_tasks` ADD CONSTRAINT `partido_crm_tasks_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_crm_tasks` ADD CONSTRAINT `partido_crm_tasks_person_id_fkey` FOREIGN KEY (`person_id`) REFERENCES `partido_people`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_crm_tasks` ADD CONSTRAINT `partido_crm_tasks_assigned_to_fkey` FOREIGN KEY (`assigned_to`) REFERENCES `partido_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_crm_notifications` ADD CONSTRAINT `partido_crm_notifications_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_crm_notifications` ADD CONSTRAINT `partido_crm_notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `partido_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_crm_events` ADD CONSTRAINT `partido_crm_events_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_crm_event_attendances` ADD CONSTRAINT `partido_crm_event_attendances_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `partido_crm_events`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_crm_event_attendances` ADD CONSTRAINT `partido_crm_event_attendances_person_id_fkey` FOREIGN KEY (`person_id`) REFERENCES `partido_people`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_crm_event_attendances` ADD CONSTRAINT `partido_crm_event_attendances_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_crm_device_tokens` ADD CONSTRAINT `partido_crm_device_tokens_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_crm_device_tokens` ADD CONSTRAINT `partido_crm_device_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `partido_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_crm_imports` ADD CONSTRAINT `partido_crm_imports_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_elections` ADD CONSTRAINT `partido_elections_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_campaigns` ADD CONSTRAINT `partido_campaigns_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_campaigns` ADD CONSTRAINT `partido_campaigns_election_id_fkey` FOREIGN KEY (`election_id`) REFERENCES `partido_elections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_campaigns` ADD CONSTRAINT `partido_campaigns_person_id_fkey` FOREIGN KEY (`person_id`) REFERENCES `partido_people`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_campaign_team` ADD CONSTRAINT `partido_campaign_team_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_campaign_team` ADD CONSTRAINT `partido_campaign_team_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `partido_campaigns`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_campaign_team` ADD CONSTRAINT `partido_campaign_team_person_id_fkey` FOREIGN KEY (`person_id`) REFERENCES `partido_people`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_campaign_contracts` ADD CONSTRAINT `partido_campaign_contracts_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_campaign_contracts` ADD CONSTRAINT `partido_campaign_contracts_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `partido_campaigns`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_campaign_contracts` ADD CONSTRAINT `partido_campaign_contracts_person_id_fkey` FOREIGN KEY (`person_id`) REFERENCES `partido_people`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_campaign_contract_payments` ADD CONSTRAINT `partido_campaign_contract_payments_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_campaign_contract_payments` ADD CONSTRAINT `partido_campaign_contract_payments_contract_id_fkey` FOREIGN KEY (`contract_id`) REFERENCES `partido_campaign_contracts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_campaign_schedule` ADD CONSTRAINT `partido_campaign_schedule_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_campaign_schedule` ADD CONSTRAINT `partido_campaign_schedule_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `partido_campaigns`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_tse_reports` ADD CONSTRAINT `partido_tse_reports_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_tse_reports` ADD CONSTRAINT `partido_tse_reports_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `partido_campaigns`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_tse_report_items` ADD CONSTRAINT `partido_tse_report_items_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `partido_tse_reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_tse_report_items` ADD CONSTRAINT `partido_tse_report_items_tse_code_id_fkey` FOREIGN KEY (`tse_code_id`) REFERENCES `partido_tse_codes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_party_chapters` ADD CONSTRAINT `partido_party_chapters_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_party_chapters` ADD CONSTRAINT `partido_party_chapters_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `partido_party_chapters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_chapter_members` ADD CONSTRAINT `partido_chapter_members_chapter_id_fkey` FOREIGN KEY (`chapter_id`) REFERENCES `partido_party_chapters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_chapter_members` ADD CONSTRAINT `partido_chapter_members_person_id_fkey` FOREIGN KEY (`person_id`) REFERENCES `partido_people`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_chapter_members` ADD CONSTRAINT `partido_chapter_members_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_party_organs` ADD CONSTRAINT `partido_party_organs_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_organ_members` ADD CONSTRAINT `partido_organ_members_organ_id_fkey` FOREIGN KEY (`organ_id`) REFERENCES `partido_party_organs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_organ_members` ADD CONSTRAINT `partido_organ_members_person_id_fkey` FOREIGN KEY (`person_id`) REFERENCES `partido_people`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_organ_members` ADD CONSTRAINT `partido_organ_members_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_mandates` ADD CONSTRAINT `partido_mandates_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `partido_tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_mandates` ADD CONSTRAINT `partido_mandates_person_id_fkey` FOREIGN KEY (`person_id`) REFERENCES `partido_people`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido_mandates` ADD CONSTRAINT `partido_mandates_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `partido_campaigns`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


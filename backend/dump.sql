BEGIN TRANSACTION;
CREATE TABLE activity_logs (
	id UUID NOT NULL, 
	user_id UUID, 
	action VARCHAR, 
	entity VARCHAR, 
	entity_id UUID, 
	created_at TIMESTAMP, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
CREATE TABLE amazon_accounts (
	id UUID NOT NULL, 
	user_id UUID, 
	seller_id VARCHAR, 
	refresh_token TEXT, 
	region VARCHAR, 
	created_at TIMESTAMP, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
CREATE TABLE amazon_data (
	id UUID NOT NULL, 
	amazon_account_id UUID, 
	sku VARCHAR, 
	sales DECIMAL, 
	refunds DECIMAL, 
	stock INTEGER, 
	synced_at TIMESTAMP, 
	PRIMARY KEY (id), 
	FOREIGN KEY(amazon_account_id) REFERENCES amazon_accounts (id)
);
CREATE TABLE companies (
	id UUID NOT NULL, 
	name VARCHAR NOT NULL, 
	type VARCHAR(8), 
	country VARCHAR, 
	website VARCHAR, 
	created_by UUID, 
	created_at TIMESTAMP, 
	PRIMARY KEY (id), 
	FOREIGN KEY(created_by) REFERENCES users (id)
);
CREATE TABLE contacts (
	id UUID NOT NULL, 
	name VARCHAR NOT NULL, 
	email VARCHAR, 
	phone VARCHAR, 
	position VARCHAR, 
	company_id UUID, 
	created_by UUID, 
	created_at TIMESTAMP, 
	PRIMARY KEY (id), 
	FOREIGN KEY(company_id) REFERENCES companies (id), 
	FOREIGN KEY(created_by) REFERENCES users (id)
);
CREATE TABLE deals (
	id UUID NOT NULL, 
	title VARCHAR NOT NULL, 
	value DECIMAL, 
	company_id UUID, 
	contact_id UUID, 
	stage_id UUID NOT NULL, 
	position INTEGER, 
	due_date TIMESTAMP, 
	created_at TIMESTAMP, 
	updated_at TIMESTAMP, 
	PRIMARY KEY (id), 
	FOREIGN KEY(company_id) REFERENCES companies (id), 
	FOREIGN KEY(contact_id) REFERENCES contacts (id), 
	FOREIGN KEY(stage_id) REFERENCES pipeline_stages (id)
);
CREATE TABLE interaction_logs (
	id UUID NOT NULL, 
	type VARCHAR NOT NULL, 
	subject VARCHAR, 
	summary VARCHAR, 
	related_type VARCHAR NOT NULL, 
	related_id UUID NOT NULL, 
	created_by UUID, 
	created_at TIMESTAMP, 
	PRIMARY KEY (id), 
	FOREIGN KEY(created_by) REFERENCES users (id)
);
CREATE TABLE interactions (
	id UUID NOT NULL, 
	contact_id UUID, 
	type VARCHAR(7), 
	details TEXT, 
	created_by UUID, 
	created_at TIMESTAMP, 
	PRIMARY KEY (id), 
	FOREIGN KEY(contact_id) REFERENCES contacts (id), 
	FOREIGN KEY(created_by) REFERENCES users (id)
);
CREATE TABLE notes (
	id UUID NOT NULL, 
	content VARCHAR NOT NULL, 
	related_type VARCHAR NOT NULL, 
	related_id UUID NOT NULL, 
	created_by UUID, 
	created_at TIMESTAMP, 
	PRIMARY KEY (id), 
	FOREIGN KEY(created_by) REFERENCES users (id)
);
CREATE TABLE order_items (
	id UUID NOT NULL, 
	purchase_order_id UUID, 
	product_name VARCHAR, 
	quantity INTEGER, 
	unit_cost DECIMAL, 
	total_cost DECIMAL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(purchase_order_id) REFERENCES purchase_orders (id)
);
CREATE TABLE outreach_campaigns (
	id UUID NOT NULL, 
	name VARCHAR, 
	template_id UUID, 
	status VARCHAR(9), 
	created_by UUID, 
	created_at TIMESTAMP, 
	PRIMARY KEY (id), 
	FOREIGN KEY(template_id) REFERENCES templates (id), 
	FOREIGN KEY(created_by) REFERENCES users (id)
);
CREATE TABLE pipeline_stages (
	id UUID NOT NULL, 
	name VARCHAR NOT NULL, 
	order_index INTEGER NOT NULL, 
	created_at TIMESTAMP, 
	PRIMARY KEY (id)
);
CREATE TABLE purchase_orders (
	id UUID NOT NULL, 
	company_id UUID, 
	order_date DATE, 
	total_amount DECIMAL, 
	status VARCHAR(9), 
	created_by UUID, 
	created_at TIMESTAMP, 
	PRIMARY KEY (id), 
	FOREIGN KEY(company_id) REFERENCES companies (id), 
	FOREIGN KEY(created_by) REFERENCES users (id)
);
CREATE TABLE reminders (
	id UUID NOT NULL, 
	title VARCHAR NOT NULL, 
	related_type VARCHAR NOT NULL, 
	related_id UUID NOT NULL, 
	due_date TIMESTAMP NOT NULL, 
	completed INTEGER, 
	created_by UUID, 
	created_at TIMESTAMP, 
	PRIMARY KEY (id), 
	FOREIGN KEY(created_by) REFERENCES users (id)
);
CREATE TABLE roles (
	id UUID NOT NULL, 
	name VARCHAR NOT NULL, 
	PRIMARY KEY (id)
);
INSERT INTO "roles" VALUES('50c3b5202ffb40e4909a335710af0e14','Team');
CREATE TABLE tag_links (
	id UUID NOT NULL, 
	tag_id UUID, 
	related_type VARCHAR NOT NULL, 
	related_id UUID NOT NULL, 
	created_at TIMESTAMP, 
	PRIMARY KEY (id), 
	FOREIGN KEY(tag_id) REFERENCES tags (id)
);
CREATE TABLE tags (
	id UUID NOT NULL, 
	name VARCHAR NOT NULL, 
	color VARCHAR, 
	created_at TIMESTAMP, 
	PRIMARY KEY (id), 
	UNIQUE (name)
);
CREATE TABLE templates (
	id UUID NOT NULL, 
	title VARCHAR, 
	body TEXT, 
	type VARCHAR(8), 
	created_by UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(created_by) REFERENCES users (id)
);
INSERT INTO "templates" VALUES('3f9e5b3fea794b329168d0a037547cc4','Brand Outreach – Intro','Hi {{first_name}},

We help {{brand_name}} increase wholesale growth on Amazon...','brand',NULL);
INSERT INTO "templates" VALUES('0495d3621ffb4874be4130c5b38d01be','Supplier Partnership – Inquiry','Hello {{first_name}},

We''re sourcing {{product_type}} for Amazon US...','supplier',NULL);
CREATE TABLE transactions (
	id UUID NOT NULL, 
	purchase_order_id UUID, 
	type VARCHAR(7), 
	amount DECIMAL, 
	profit DECIMAL, 
	created_at TIMESTAMP, 
	PRIMARY KEY (id), 
	FOREIGN KEY(purchase_order_id) REFERENCES purchase_orders (id)
);
CREATE TABLE users (
	id UUID NOT NULL, 
	name VARCHAR NOT NULL, 
	email VARCHAR NOT NULL, 
	password VARCHAR, 
	role_id UUID, 
	created_at TIMESTAMP, 
	gmail_access_token VARCHAR, 
	gmail_refresh_token VARCHAR, 
	PRIMARY KEY (id), 
	UNIQUE (email), 
	FOREIGN KEY(role_id) REFERENCES roles (id)
);
INSERT INTO "users" VALUES('b45aa2320a3c4dbdb69fecd98592fa88','Amzdudes Ai','amzdudes.ai02@gmail.com',NULL,'50c3b5202ffb40e4909a335710af0e14','2025-11-13 08:17:55.248819',NULL,NULL);
COMMIT;

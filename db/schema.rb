# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_12_15_000200) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "beam_deflections", force: :cascade do |t|
    t.string "status", default: "draft", null: false
    t.bigint "creator_id", null: false
    t.bigint "moderator_id"
    t.datetime "formed_at"
    t.datetime "completed_at"
    t.boolean "within_norm"
    t.text "note"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.decimal "result_deflection_mm", precision: 18, scale: 6
    t.datetime "calculated_at"
    t.index ["creator_id"], name: "idx_requests_single_draft_per_user", unique: true, where: "((status)::text = 'draft'::text)"
    t.index ["creator_id"], name: "index_beam_deflections_on_creator_id"
    t.index ["formed_at"], name: "index_beam_deflections_on_formed_at"
    t.index ["moderator_id"], name: "index_beam_deflections_on_moderator_id"
    t.index ["status", "creator_id"], name: "index_beam_deflections_on_status_and_creator_id"
    t.index ["status"], name: "index_beam_deflections_on_status"
    t.check_constraint "status::text = ANY (ARRAY['draft'::character varying::text, 'deleted'::character varying::text, 'formed'::character varying::text, 'completed'::character varying::text, 'rejected'::character varying::text])", name: "check_status"
  end

  create_table "beam_deflections_beams", force: :cascade do |t|
    t.bigint "beam_deflection_id", null: false
    t.bigint "beam_id", null: false
    t.integer "quantity", default: 1, null: false
    t.integer "position", default: 1, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "is_primary", default: false, null: false
    t.decimal "length_m", precision: 8, scale: 3
    t.decimal "udl_kn_m", precision: 8, scale: 3
    t.index ["beam_deflection_id", "beam_id"], name: "idx_requests_services_unique", unique: true
    t.index ["beam_deflection_id", "beam_id"], name: "index_beam_deflections_beams_on_beam_deflection_id_and_beam_id", unique: true
    t.index ["beam_deflection_id", "beam_id"], name: "index_requests_services_on_request_and_service", unique: true
    t.check_constraint "\"position\" > 0", name: "check_position_positive"
    t.check_constraint "length_m > 0::numeric", name: "check_item_length_positive"
    t.check_constraint "quantity > 0", name: "check_quantity_positive"
    t.check_constraint "udl_kn_m >= 0::numeric", name: "check_item_udl_non_negative"
  end

  create_table "beams", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.boolean "active", default: true, null: false
    t.string "image_url"
    t.string "material", null: false
    t.decimal "elasticity_gpa", precision: 6, scale: 2, null: false
    t.decimal "inertia_cm4", precision: 12, scale: 2, null: false
    t.integer "allowed_deflection_ratio", default: 250, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "image_key"
    t.index ["active"], name: "index_beams_on_active"
    t.index ["name"], name: "index_beams_on_name", unique: true
    t.check_constraint "allowed_deflection_ratio > 0", name: "check_deflection_ratio_positive"
    t.check_constraint "elasticity_gpa > 0::numeric", name: "check_elasticity_positive"
    t.check_constraint "inertia_cm4 > 0::numeric", name: "check_inertia_positive"
    t.check_constraint "material::text = ANY (ARRAY['wooden'::character varying::text, 'steel'::character varying::text, 'reinforced_concrete'::character varying::text])", name: "check_material"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", null: false
    t.string "password_digest", null: false
    t.boolean "moderator", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "beam_deflections", "users", column: "creator_id", on_delete: :restrict
  add_foreign_key "beam_deflections", "users", column: "moderator_id", on_delete: :nullify
  add_foreign_key "beam_deflections_beams", "beam_deflections", on_delete: :restrict
  add_foreign_key "beam_deflections_beams", "beams", on_delete: :restrict
end

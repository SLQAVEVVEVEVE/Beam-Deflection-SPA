class MoveRequestParamsToBeamDeflectionItems < ActiveRecord::Migration[8.0]
  def up
    unless column_exists?(:beam_deflections_beams, :length_m)
      add_column :beam_deflections_beams, :length_m, :decimal, precision: 8, scale: 3
    end

    unless column_exists?(:beam_deflections_beams, :udl_kn_m)
      add_column :beam_deflections_beams, :udl_kn_m, :decimal, precision: 8, scale: 3
    end

    if column_exists?(:beam_deflections, :length_m) || column_exists?(:beam_deflections, :udl_kn_m)
      execute <<~SQL
        UPDATE beam_deflections_beams bdb
        SET length_m = COALESCE(bdb.length_m, bd.length_m),
            udl_kn_m = COALESCE(bdb.udl_kn_m, bd.udl_kn_m)
        FROM beam_deflections bd
        WHERE bdb.beam_deflection_id = bd.id;
      SQL
    end

    execute <<~SQL
      ALTER TABLE beam_deflections_beams DROP CONSTRAINT IF EXISTS check_item_length_positive;
      ALTER TABLE beam_deflections_beams DROP CONSTRAINT IF EXISTS check_item_udl_non_negative;
      ALTER TABLE beam_deflections_beams ADD CONSTRAINT check_item_length_positive CHECK (length_m > 0);
      ALTER TABLE beam_deflections_beams ADD CONSTRAINT check_item_udl_non_negative CHECK (udl_kn_m >= 0);
    SQL

    execute <<~SQL
      ALTER TABLE beam_deflections DROP CONSTRAINT IF EXISTS check_length_positive;
      ALTER TABLE beam_deflections DROP CONSTRAINT IF EXISTS check_udl_non_negative;
    SQL

    remove_column :beam_deflections, :length_m if column_exists?(:beam_deflections, :length_m)
    remove_column :beam_deflections, :udl_kn_m if column_exists?(:beam_deflections, :udl_kn_m)
  end

  def down
    add_column :beam_deflections, :length_m, :decimal, precision: 8, scale: 3 unless column_exists?(:beam_deflections, :length_m)
    add_column :beam_deflections, :udl_kn_m, :decimal, precision: 8, scale: 3 unless column_exists?(:beam_deflections, :udl_kn_m)

    execute <<~SQL
      UPDATE beam_deflections bd
      SET length_m = bdb.length_m,
          udl_kn_m = bdb.udl_kn_m
      FROM (
        SELECT DISTINCT ON (beam_deflection_id)
          beam_deflection_id,
          length_m,
          udl_kn_m
        FROM beam_deflections_beams
        WHERE length_m IS NOT NULL OR udl_kn_m IS NOT NULL
        ORDER BY beam_deflection_id, id
      ) bdb
      WHERE bd.id = bdb.beam_deflection_id;
    SQL

    execute <<~SQL
      ALTER TABLE beam_deflections DROP CONSTRAINT IF EXISTS check_length_positive;
      ALTER TABLE beam_deflections DROP CONSTRAINT IF EXISTS check_udl_non_negative;
      ALTER TABLE beam_deflections ADD CONSTRAINT check_length_positive CHECK (length_m > 0);
      ALTER TABLE beam_deflections ADD CONSTRAINT check_udl_non_negative CHECK (udl_kn_m >= 0);

      ALTER TABLE beam_deflections_beams DROP CONSTRAINT IF EXISTS check_item_length_positive;
      ALTER TABLE beam_deflections_beams DROP CONSTRAINT IF EXISTS check_item_udl_non_negative;
    SQL

    remove_column :beam_deflections_beams, :length_m if column_exists?(:beam_deflections_beams, :length_m)
    remove_column :beam_deflections_beams, :udl_kn_m if column_exists?(:beam_deflections_beams, :udl_kn_m)
  end
end


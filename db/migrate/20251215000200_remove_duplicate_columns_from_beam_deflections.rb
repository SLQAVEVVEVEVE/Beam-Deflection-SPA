class RemoveDuplicateColumnsFromBeamDeflections < ActiveRecord::Migration[8.0]
  def up
    if column_exists?(:beam_deflections_beams, :primary) && column_exists?(:beam_deflections_beams, :is_primary)
      execute <<~SQL
        UPDATE beam_deflections_beams
        SET is_primary = TRUE
        WHERE "primary" IS TRUE AND is_primary IS DISTINCT FROM TRUE;
      SQL
    end

    if column_exists?(:beam_deflections, :deflection_mm) && column_exists?(:beam_deflections, :result_deflection_mm)
      execute <<~SQL
        UPDATE beam_deflections
        SET result_deflection_mm = deflection_mm
        WHERE result_deflection_mm IS NULL AND deflection_mm IS NOT NULL;
      SQL
    end

    remove_column :beam_deflections_beams, :primary if column_exists?(:beam_deflections_beams, :primary)
    remove_column :beam_deflections_beams, :deflection_mm if column_exists?(:beam_deflections_beams, :deflection_mm)
    remove_column :beam_deflections, :deflection_mm if column_exists?(:beam_deflections, :deflection_mm)
  end

  def down
    unless column_exists?(:beam_deflections, :deflection_mm)
      add_column :beam_deflections, :deflection_mm, :decimal, precision: 10, scale: 3
    end

    unless column_exists?(:beam_deflections_beams, :deflection_mm)
      add_column :beam_deflections_beams, :deflection_mm, :decimal, precision: 18, scale: 6
    end

    unless column_exists?(:beam_deflections_beams, :primary)
      add_column :beam_deflections_beams, :primary, :boolean, null: false, default: false
    end

    if column_exists?(:beam_deflections_beams, :primary) && column_exists?(:beam_deflections_beams, :is_primary)
      execute <<~SQL
        UPDATE beam_deflections_beams
        SET "primary" = TRUE
        WHERE is_primary IS TRUE AND "primary" IS DISTINCT FROM TRUE;
      SQL
    end
  end
end

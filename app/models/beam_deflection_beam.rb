class BeamDeflectionBeam < ApplicationRecord
  self.table_name = "beam_deflections_beams"
  
  belongs_to :beam_deflection
  belongs_to :beam

  # Set default values
  attribute :is_primary, :boolean, default: false
  attribute :quantity, :integer, default: 1
  attribute :position, :integer, default: 1

  # Validations
  validates :quantity, numericality: { only_integer: true, greater_than: 0 }
  validates :is_primary, inclusion: { in: [true, false] }
  validates :beam_deflection_id, uniqueness: { scope: :beam_id }
  validates :length_m, numericality: { greater_than: 0 }, allow_nil: true
  validates :udl_kn_m, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  
  # Backward compatibility
  before_validation do
    self.is_primary = false if is_primary.nil?
    self.quantity = 1 if quantity.nil?
    self.position = 1 if position.nil?
  end
end

class BeamDeflection < ApplicationRecord
  STATUSES = {
    draft: 'draft',
    formed: 'formed',
    completed: 'completed',
    rejected: 'rejected',
    deleted: 'deleted',
  }.freeze

  belongs_to :creator,
             class_name: 'User',
             foreign_key: :creator_id,
             inverse_of: :beam_deflections

  belongs_to :moderator,
             class_name: 'User',
             foreign_key: :moderator_id,
             optional: true,
             inverse_of: :moderated_beam_deflections

  has_many :beam_deflection_beams, dependent: :destroy
  has_many :beams, through: :beam_deflection_beams

  validates :status, presence: true, inclusion: { in: STATUSES.values }
  validates :creator_id, presence: true

  validate :validate_single_draft_per_user, if: :draft?

  scope :draft, -> { where(status: STATUSES[:draft]) }
  scope :formed, -> { where(status: STATUSES[:formed]) }
  scope :completed, -> { where(status: STATUSES[:completed]) }
  scope :rejected, -> { where(status: STATUSES[:rejected]) }
  scope :deleted, -> { where(status: STATUSES[:deleted]) }
  scope :active, -> { where.not(status: STATUSES[:deleted]) }
  scope :not_deleted, -> { where.not(status: STATUSES[:deleted]) }
  scope :not_draft, -> { where.not(status: STATUSES[:draft]) }
  scope :by_statuses, ->(statuses) { where(status: statuses) if statuses.present? }
  scope :draft_for, ->(user) { where(creator: user, status: STATUSES[:draft]) }

  before_validation :set_default_status, on: :create
  before_save :set_timestamps

  def draft? = status == STATUSES[:draft]
  def formed? = status == STATUSES[:formed]
  def completed? = status == STATUSES[:completed]
  def rejected? = status == STATUSES[:rejected]
  def deleted? = status == STATUSES[:deleted]
  public :draft?, :formed?, :completed?, :rejected?, :deleted?

  def self.ensure_draft_for(user)
    draft_for(user).first_or_create! do |request|
      request.creator = user
    end
  end

  def can_form_by?(user)
    creator == user && draft?
  end

  def can_complete_by?(user)
    user.moderator? && formed?
  end

  def can_reject_by?(user)
    user.moderator? && formed?
  end

  def compute_result_values
    total_deflection_mm = 0.0
    within_norm = true

    beam_deflection_beams.includes(:beam).find_each do |item|
      item_deflection_mm = Calc::Deflection.call(item, item.beam)
      total_deflection_mm += item_deflection_mm.to_f * item.quantity.to_i

      ratio = item.beam&.allowed_deflection_ratio.to_f
      max_allowed = ratio.positive? ? (item.length_m.to_f * 1000.0 / ratio) : Float::INFINITY
      within_norm &&= item_deflection_mm.to_f <= max_allowed
    end

    { total_deflection_mm: total_deflection_mm, within_norm: within_norm }
  end

  def compute_result!
    values = compute_result_values

    update!(
      result_deflection_mm: values[:total_deflection_mm],
      within_norm: values[:within_norm],
      calculated_at: Time.current
    )

    values
  end

  def compute_and_store_result_deflection!
    compute_result!
  end

  private

  def set_default_status
    self.status ||= STATUSES[:draft]
  end

  def validate_single_draft_per_user
    return unless creator_id.present?

    scope = self.class.where(creator_id: creator_id, status: STATUSES[:draft])
    scope = scope.where.not(id: id) if persisted?
    errors.add(:base, 'У пользователя уже есть черновик') if scope.exists?
  end

  def set_timestamps
    return unless will_save_change_to_status?

    case status
    when STATUSES[:formed]
      self.formed_at ||= Time.current
    when STATUSES[:completed]
      self.completed_at ||= Time.current
    end
  end
end


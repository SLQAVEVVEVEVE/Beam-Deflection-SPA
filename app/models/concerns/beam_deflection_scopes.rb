module BeamDeflectionScopes
  extend ActiveSupport::Concern
  
  included do
    STATUSES = {
      draft:     'draft',
      formed:    'formed',
      completed: 'completed',
      rejected:  'rejected',
      deleted:   'deleted'
    }.freeze

    # Status scopes
    scope :draft,       -> { where(status: STATUSES[:draft]) }
    scope :formed,      -> { where(status: STATUSES[:formed]) }
    scope :completed,   -> { where(status: STATUSES[:completed]) }
    scope :rejected,    -> { where(status: STATUSES[:rejected]) }
    scope :active,      -> { where.not(status: STATUSES[:deleted]) }
    scope :not_deleted, -> { where.not(status: STATUSES[:deleted]) }
    scope :not_draft,   -> { where.not(status: STATUSES[:draft]) }
    scope :by_statuses, ->(statuses) { where(status: statuses) if statuses.present? }
    scope :formed_between, ->(from, to) {
      where(formed_at: from.present? && to.present? ? (from..to) : nil)
    }
    scope :draft_for, ->(user) { where(creator: user, status: STATUSES[:draft]) }
    
    # Status predicate methods
    def draft?; status == STATUSES[:draft]; end
    def formed?; status == STATUSES[:formed]; end
    def completed?; status == STATUSES[:completed]; end
    def rejected?; status == STATUSES[:rejected]; end
    def deleted?; status == STATUSES[:deleted]; end
  end
  
  # Class methods
  def self.ensure_draft_for(user)
    draft_for(user).first_or_create!
  end
  
  # Instance methods
  def can_form_by?(user)
    creator == user && draft?
  end
  
  def can_complete_by?(user)
    user.moderator? && formed?
  end
  
  def can_reject_by?(user)
    user.moderator? && formed?
  end
  
  def compute_result!
    total_deflection = 0.0
    within_norm = true
    
    beam_deflection_beams.includes(:beam).find_each do |bdb|
      item_deflection = Calc::Deflection.call(bdb, bdb.beam)
      total_deflection += item_deflection.to_f * bdb.quantity.to_i

      ratio = bdb.beam&.allowed_deflection_ratio.to_f
      max_allowed = ratio.positive? ? (bdb.length_m.to_f * 1000.0 / ratio) : Float::INFINITY
      within_norm &&= item_deflection.to_f <= max_allowed
    end
    
    update!(
      result_deflection_mm: total_deflection,
      within_norm: within_norm,
      calculated_at: Time.current
    )

    total_deflection
  end
  
  def calculated_items_count
    result_deflection_mm.presence || beam_deflection_beams.count
  end
end

module Calc
  class Deflection
    def self.call(item, beam = nil)
      beam ||= item.beam
      # q - нагрузка в Н/м (переводим из кН/м)
      q = item.udl_kn_m.to_f * 1000 # кН/м -> Н/м
      
      # L - длина пролёта в метрах
      l = item.length_m.to_f
      
      # E - модуль упругости в Па (переводим из ГПа)
      e = beam.elasticity_gpa.to_f * 1e9 # ГПа -> Па
      
      # J - момент инерции в м^4 (переводим из см^4)
      j = beam.inertia_cm4.to_f * 1e-8 # см^4 -> м^4

      return 0.0 if l <= 0 || q < 0 || e <= 0 || j <= 0
      
      # Формула для расчёта прогиба: w = 5 * q * L^4 / (384 * E * J)
      # Результат в метрах, переводим в миллиметры (*1000)
      (5 * q * (l ** 4)) / (384 * e * j) * 1000
    rescue => e
      Rails.logger.error("Error calculating deflection: #{e.message}")
      0.0
    end
  end
end

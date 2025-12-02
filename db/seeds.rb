require 'base64'
require 'aws-sdk-s3'

MINIO_PLACEHOLDER = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGBgAAAABQABDQottAAAAABJRU5ErkJggg=='

MINIO_EXTERNAL = ENV.fetch('MINIO_EXTERNAL_ENDPOINT', 'http://localhost:9000')
MINIO_BUCKET = ENV.fetch('MINIO_BUCKET', 'beam-deflection')

# Upload tiny placeholder if object absent
# key is relative inside bucket (e.g., seeds/wood.png)
def upload_placeholder_to_minio(key)
  cfg = Rails.application.config.x.minio
  s3 = Aws::S3::Resource.new
  bucket = s3.bucket(cfg[:bucket])
  bucket.create unless bucket.exists?

  obj = bucket.object(key)
  return if obj.exists?

  obj.put(body: Base64.decode64(MINIO_PLACEHOLDER), content_type: 'image/png')
end

beams = [
  {
    name: 'Деревянная балка 50x150',
    material: 'wooden',
    elasticity_gpa: 10,
    inertia_cm4: 80000,
    allowed_deflection_ratio: 250,
    description: 'Легкая балка для демонстрации расчётов прогиба по нормативу L/250.',
    image_key: 'seeds/wood.png'
  },
  {
    name: 'Стальная балка 100x200',
    material: 'steel',
    elasticity_gpa: 200,
    inertia_cm4: 120000,
    allowed_deflection_ratio: 250,
    description: 'Сталь для высоких нагрузок и пролётов, пример расчёта с большой жёсткостью.',
    image_key: 'seeds/steel.png'
  },
  {
    name: 'Железобетонная балка 120x300',
    material: 'reinforced_concrete',
    elasticity_gpa: 30,
    inertia_cm4: 100000,
    allowed_deflection_ratio: 250,
    description: 'ЖБИ для тяжёлых конструкций, демонстрация прогиба с учётом высокой инерции.',
    image_key: 'seeds/rc.png'
  }
]

beams.each do |attrs|
  upload_placeholder_to_minio(attrs[:image_key])

  public_url = "#{MINIO_EXTERNAL}/#{MINIO_BUCKET}/#{attrs[:image_key]}"

  beam = Beam.find_or_initialize_by(name: attrs[:name])
  beam.assign_attributes(attrs.merge(image_url: public_url))
  beam.active = true if beam.respond_to?(:active=)
  beam.save!
end

puts "Seeded beams: #{Beam.count}"
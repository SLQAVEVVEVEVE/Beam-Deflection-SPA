require 'base64'
require 'aws-sdk-s3'

MINIO_PLACEHOLDER = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGBgAAAABQABDQottAAAAABJRU5ErkJggg=='

MINIO_EXTERNAL = ENV.fetch('MINIO_EXTERNAL_ENDPOINT', 'http://localhost:9000')
MINIO_BUCKET = ENV.fetch('MINIO_BUCKET', 'beam-deflection')
WOOD_IMAGE_KEY = 'wooden.png'
STEEL_IMAGE_KEY = 'steel.jpg'
RC_IMAGE_KEY = 'rc.jpg'

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
    description: 'Деревянная балка для легких перекрытий и кровель, акцент на малый вес и теплые конструкции. Область применения: частные коттеджи и мансардные этажи.',
    image_key: WOOD_IMAGE_KEY
  },
  {
    name: 'Деревянная балка 40x120',
    material: 'wooden',
    elasticity_gpa: 9,
    inertia_cm4: 52000,
    allowed_deflection_ratio: 200,
    description: 'Деревянная балка для легких перекрытий и кровель, акцент на малый вес и теплые конструкции. Область применения: дачные дома и хозяйственные постройки.',
    image_key: WOOD_IMAGE_KEY
  },
  {
    name: 'Деревянная балка 60x200',
    material: 'wooden',
    elasticity_gpa: 11,
    inertia_cm4: 98000,
    allowed_deflection_ratio: 250,
    description: 'Деревянная балка для легких перекрытий и кровель, акцент на малый вес и теплые конструкции. Область применения: каркасные дома и жилые перекрытия.',
    image_key: WOOD_IMAGE_KEY
  },
  {
    name: 'Деревянная балка клееная 90x240',
    material: 'wooden',
    elasticity_gpa: 12,
    inertia_cm4: 130000,
    allowed_deflection_ratio: 300,
    description: 'Деревянная балка для легких перекрытий и кровель, акцент на малый вес и теплые конструкции. Область применения: спортивные залы и общественные здания.',
    image_key: WOOD_IMAGE_KEY
  },
  {
    name: 'Стальная балка 100x200',
    material: 'steel',
    elasticity_gpa: 200,
    inertia_cm4: 120000,
    allowed_deflection_ratio: 250,
    description: 'Стальная балка для средних и больших пролетов, высокая жесткость и запас по нагрузке. Область применения: производственные цеха и складские комплексы.',
    image_key: STEEL_IMAGE_KEY
  },
  {
    name: 'Стальная балка 80x160',
    material: 'steel',
    elasticity_gpa: 195,
    inertia_cm4: 90000,
    allowed_deflection_ratio: 240,
    description: 'Стальная балка для средних и больших пролетов, высокая жесткость и запас по нагрузке. Область применения: торговые залы и логистические терминалы.',
    image_key: STEEL_IMAGE_KEY
  },
  {
    name: 'Стальная балка 120x200',
    material: 'steel',
    elasticity_gpa: 205,
    inertia_cm4: 140000,
    allowed_deflection_ratio: 280,
    description: 'Стальная балка для средних и больших пролетов, высокая жесткость и запас по нагрузке. Область применения: паркинги и многоуровневые стоянки.',
    image_key: STEEL_IMAGE_KEY
  },
  {
    name: 'Стальная балка 200x300',
    material: 'steel',
    elasticity_gpa: 210,
    inertia_cm4: 220000,
    allowed_deflection_ratio: 300,
    description: 'Стальная балка для средних и больших пролетов, высокая жесткость и запас по нагрузке. Область применения: мостовые конструкции и эстакады.',
    image_key: STEEL_IMAGE_KEY
  },
  {
    name: 'Железобетонная балка 120x300',
    material: 'reinforced_concrete',
    elasticity_gpa: 30,
    inertia_cm4: 100000,
    allowed_deflection_ratio: 250,
    description: 'Железобетонная балка для тяжелых нагрузок, высокая инерция и устойчивость к прогибам. Область применения: монолитные жилые комплексы.',
    image_key: RC_IMAGE_KEY
  },
  {
    name: 'Железобетонная балка 150x250',
    material: 'reinforced_concrete',
    elasticity_gpa: 28,
    inertia_cm4: 115000,
    allowed_deflection_ratio: 280,
    description: 'Железобетонная балка для тяжелых нагрузок, высокая инерция и устойчивость к прогибам. Область применения: общественные здания и школы.',
    image_key: RC_IMAGE_KEY
  },
  {
    name: 'Железобетонная балка 200x400',
    material: 'reinforced_concrete',
    elasticity_gpa: 32,
    inertia_cm4: 180000,
    allowed_deflection_ratio: 400,
    description: 'Железобетонная балка для тяжелых нагрузок, высокая инерция и устойчивость к прогибам. Область применения: транспортные узлы и терминалы.',
    image_key: RC_IMAGE_KEY
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

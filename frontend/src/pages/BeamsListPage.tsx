import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Col, Collapse, Form, InputGroup, ProgressBar, Row, Spinner, Stack } from 'react-bootstrap'
import { BeamCard } from '../components/BeamCard'
import { useBeamImageSearch } from '../hooks/useBeamImageSearch'
import { selectIsAuthenticated } from '../store/authSlice'
import { addBeamToBeamDeflectionDraftAsync, selectDraftAddingBeamIds } from '../store/draftSlice'
import { fetchBeamsAsync, selectBeams, selectBeamsError, selectBeamsLoading } from '../store/beamsSlice'
import { applyFilters, selectAppliedFilters, selectCurrentFilters, setFilters } from '../store/filtersSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'

export function BeamsListPage() {
  const dispatch = useAppDispatch()
  const currentFilters = useAppSelector(selectCurrentFilters)
  const appliedFilters = useAppSelector(selectAppliedFilters)
  const isAuthed = useAppSelector(selectIsAuthenticated)

  const beams = useAppSelector(selectBeams)
  const loading = useAppSelector(selectBeamsLoading)
  const error = useAppSelector(selectBeamsError)
  const addingBeamIds = useAppSelector(selectDraftAddingBeamIds)
  const { items: processedBeams, ready, progress, imageEmbedding, searchByImage, resetSearch } =
    useBeamImageSearch(beams)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showImageSearch, setShowImageSearch] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dispatch(fetchBeamsAsync(appliedFilters))
  }, [dispatch, appliedFilters])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node
      if (!searchAreaRef.current?.contains(target)) {
        setShowImageSearch(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('touchstart', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (selectedImage) URL.revokeObjectURL(selectedImage)
    }
  }, [selectedImage])

  const visibleBeams = processedBeams.filter((beam) => beam.isVisible)
  const hasQueryImage = Boolean(selectedImage && imageEmbedding)
  const uploadLabel = ready ? 'Загрузить изображение' : 'Загрузка CLIP-модели...'
  const isUploadDisabled = !ready || loading || beams.length === 0

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const nextUrl = URL.createObjectURL(file)
    setSelectedImage((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return nextUrl
    })
    searchByImage(file)
  }

  const handleClearSearch = () => {
    setSelectedImage(null)
    resetSearch()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Stack gap={2} className="page-container">
      <div className="section-title">Каталог балок</div>

      <div ref={searchAreaRef} className="beam-search-stack">
        <div className="search-bar">
          <InputGroup>
            <Form.Control
              placeholder="Поиск по названию..."
              value={currentFilters.name || ''}
              onFocus={() => setShowImageSearch(true)}
              onChange={(e) => dispatch(setFilters({ name: e.target.value, page: 1 }))}
              onKeyDown={(e) => e.key === 'Enter' && dispatch(applyFilters(undefined))}
            />
            <button
              className="btn btn-search"
              type="button"
              onClick={() => dispatch(applyFilters(undefined))}
              disabled={loading}
            >
              Найти
            </button>
          </InputGroup>
        </div>

        <Collapse in={showImageSearch}>
          <div id="beam-image-search-panel" className="beam-image-search">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleImageUpload}
            />
            <div className="beam-image-search__preview">
              {selectedImage ? (
                <img src={selectedImage} alt="Поиск по изображению балки" />
              ) : (
                <div className="beam-image-search__placeholder">Загрузите изображение балки</div>
              )}
            </div>
            <div className="beam-image-search__actions">
              <Button
                variant="accent"
                className="beam-image-search__btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadDisabled}
              >
                {uploadLabel}
              </Button>
              {!ready && <ProgressBar now={Math.round(progress)} label={`${Math.round(progress)}%`} animated />}
              <Button
                variant="outline-danger"
                className="beam-image-search__btn"
                onClick={handleClearSearch}
                disabled={!selectedImage}
              >
                Сбросить поиск
              </Button>
            </div>
          </div>
        </Collapse>
      </div>

      {error && <Alert variant="danger">Не удалось загрузить балки: {error}</Alert>}

      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" role="status" />
        </div>
      ) : beams.length === 0 ? (
        <Alert variant="info">Балки не найдены.</Alert>
      ) : visibleBeams.length === 0 ? (
        <Alert variant="info">По загруженному изображению ничего не найдено.</Alert>
      ) : (
        <Row xs={1} md={2} className="g-3">
          {visibleBeams.map((beam) => (
            <Col key={beam.id}>
              <div className="beam-card-wrapper">
                <BeamCard
                  beam={beam}
                  onAdd={isAuthed ? () => dispatch(addBeamToBeamDeflectionDraftAsync({ beamId: beam.id })) : undefined}
                  addLoading={addingBeamIds.includes(beam.id)}
                  addDisabled={!isAuthed}
                />
                {hasQueryImage && <div className="beam-score">Сходство: {(beam.score * 100).toFixed(1)}%</div>}
              </div>
            </Col>
          ))}
        </Row>
      )}
    </Stack>
  )
}

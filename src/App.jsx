import { useEffect, useRef, useState } from 'react'
import haileePortrait from './assets/hailee-portrait-web.jpg'
import './App.css'

const starburstThumbnail = '/thumbnails/starburst.jpg'
const collarThumbnail = '/thumbnails/&collar.jpg'
const upackThumbnail = '/thumbnails/U Pack.jpg'
const chickenSaladChickThumbnail = '/thumbnails/chicken salas chick.png'
const bearBabyFoodPrepperThumbnail = '/thumbnails/bear baby food prepper.png'
const spruceWeedKillerThumbnail = '/thumbnails/spruce weed killer.png'
const grwmThumbnail = '/thumbnails/grwm.png'
const drugstoreVideo = '/videos-web-720/grwm.mp4'

const featuredUgc = [
  {
    title: 'U-Pack',
    category: 'Vlog + Tutorial',
    videos: [
      { label: 'U-Pack vlog', src: '/videos-web-720/upack-vlog.mp4', thumbnail: upackThumbnail },
      { label: 'U-Pack how-to / explainer', src: '/videos-web-720/upack-explainer.mp4', thumbnail: upackThumbnail },
    ],
  },
  {
    title: 'Chicken Salad Chick',
    category: 'Voiceover',
    videos: [{ label: 'Chicken Salad Chick video', src: '/videos-web-720/chicken-salad-chick.mp4', thumbnail: chickenSaladChickThumbnail }],
  },
  {
    title: '&Collar',
    category: 'Talking Head + Voiceover',
    videos: [{ label: '&Collar video', src: '/videos-web-720/andcollar.mp4', thumbnail: collarThumbnail }],
  },
  {
    title: 'BEAR',
    category: 'Product Demonstration',
    videos: [{ label: 'Bear Baby Food Prepper video', src: '/videos-web-720/bear-baby-food-prepper.mp4', thumbnail: bearBabyFoodPrepperThumbnail }],
  },
  {
    title: 'Spruce',
    category: 'Product Education + Voiceover',
    videos: [{ label: 'Spruce Weed Killer video', src: '/videos-web-720/spruce-weed-killer.mp4', thumbnail: spruceWeedKillerThumbnail }],
  },
  {
    title: 'Starburst',
    category: 'Creative Product Integration',
    videos: [{ label: 'Starburst video', src: '/videos-web-720/starburst.mp4', thumbnail: starburstThumbnail }],
  },
  {
    title: 'Drugstore',
    category: 'GRWM / Music-Led Content',
    videos: [{ label: 'Drugstore GRWM video', src: drugstoreVideo, thumbnail: grwmThumbnail }],
  },
]

const defaultCarouselPositionCount = featuredUgc.length - 3 + 1

function getCarouselMetrics(carousel) {
  const firstCard = carousel.firstElementChild
  const gap = Number.parseFloat(getComputedStyle(carousel).gap) || 0
  const step = firstCard ? firstCard.getBoundingClientRect().width + gap : carousel.clientWidth
  const visibleCards = Math.max(1, Math.round((carousel.clientWidth + gap) / step))

  return {
    step,
    positionCount: Math.max(1, featuredUgc.length - visibleCards + 1),
  }
}

function getStickyHeaderHeight() {
  return Array.from(document.querySelectorAll('[data-sticky-header], header'))
    .filter((element) => {
      const position = getComputedStyle(element).position
      return position === 'fixed' || position === 'sticky'
    })
    .reduce((height, element) => Math.max(height, element.getBoundingClientRect().bottom), 0)
}

function useVideoPreloader(sources) {
  const preloadersRef = useRef([])

  useEffect(() => {
    const requestedSources = [...new Set(sources)].slice(0, 2)
    const releasePreloader = (entry) => {
      entry.player.pause()
      entry.player.removeAttribute('src')
      entry.player.load()
      entry.src = null
    }

    preloadersRef.current.forEach((entry) => {
      if (entry.src && !requestedSources.includes(entry.src)) releasePreloader(entry)
    })

    requestedSources.forEach((src) => {
      if (preloadersRef.current.some((entry) => entry.src === src)) return

      let entry = preloadersRef.current.find((preloader) => !preloader.src)
      if (!entry && preloadersRef.current.length < 2) {
        const player = document.createElement('video')
        player.preload = 'auto'
        player.muted = true
        player.playsInline = true
        entry = { player, src: null }
        preloadersRef.current.push(entry)
      }
      if (!entry) return

      entry.src = src
      entry.player.src = src
      entry.player.load()
    })
  }, [sources])

  useEffect(() => {
    return () => {
      preloadersRef.current.forEach((entry) => {
        entry.player.pause()
        entry.player.removeAttribute('src')
        entry.player.load()
      })
    }
  }, [])
}

function UgcVideoPreview({ video }) {
  return (
    <div className="ugc-video-preview">
      <video poster={video.thumbnail} muted playsInline preload="none" aria-label={video.label} />
      <span className="ugc-video-preview__play" aria-hidden="true">▶</span>
    </div>
  )
}

function UgcModal({ video, onClose, onPrevious, onNext, onPlaybackStarted }) {
  const [selectedVariant, setSelectedVariant] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const videoRef = useRef(null)
  const activeVideo = video.videos[selectedVariant]

  useEffect(() => {
    const player = videoRef.current
    if (!player) return

    let isCurrentSource = true
    setIsLoading(true)

    const startPlayback = async () => {
      if (!isCurrentSource) return false

      player.muted = false
      try {
        await player.play()
        return true
      } catch {
        player.muted = true
        try {
          await player.play()
          return true
        } catch {
          return false
        }
      }
    }

    const handleCanPlay = async () => {
      setIsLoading(false)
      const didStartPlayback = await startPlayback()
      if (didStartPlayback && isCurrentSource) onPlaybackStarted()
    }

    const handleError = () => setIsLoading(false)

    player.pause()
    player.removeAttribute('src')
    player.load()
    player.addEventListener('canplay', handleCanPlay, { once: true })
    player.addEventListener('error', handleError, { once: true })
    player.src = activeVideo.src
    player.load()

    return () => {
      isCurrentSource = false
      player.removeEventListener('canplay', handleCanPlay)
      player.removeEventListener('error', handleError)
      player.pause()
      player.removeAttribute('src')
      player.load()
    }
  }, [activeVideo.src])

  return (
    <div className="ugc-modal" role="presentation" onClick={onClose}>
      <div
        className="ugc-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ugc-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="ugc-modal__close" type="button" onClick={onClose}>
          Close <span aria-hidden="true">×</span>
        </button>
        {onPrevious && (
          <button className="ugc-modal__arrow ugc-modal__arrow--previous" type="button" onClick={onPrevious} aria-label="Show previous portfolio video">
            ←
          </button>
        )}
        {onNext && (
          <button className="ugc-modal__arrow ugc-modal__arrow--next" type="button" onClick={onNext} aria-label="Show next portfolio video">
            →
          </button>
        )}
        <div className={`ugc-modal__video${isLoading ? ' ugc-modal__video--loading' : ''}`} aria-busy={isLoading}>
          <video ref={videoRef} poster={activeVideo.thumbnail} controls playsInline preload="auto" />
          {isLoading && <span className="ugc-modal__loading" role="status" aria-label="Loading video" />}
        </div>
        <div className="ugc-modal__details">
          <p>Featured UGC</p>
          <h3 id="ugc-modal-title">{video.title}</h3>
          <span>{video.category}</span>
          {video.videos.length > 1 && (
            <div className="ugc-modal__variants" aria-label="U-Pack video options">
              {video.videos.map((variant, index) => (
                <button
                  key={variant.src}
                  type="button"
                  aria-pressed={selectedVariant === index}
                  onClick={() => setSelectedVariant(index)}
                >
                  {variant.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function App() {
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [preloadSources, setPreloadSources] = useState([])
  const [activeCard, setActiveCard] = useState(0)
  const [carouselPositionCount, setCarouselPositionCount] = useState(defaultCarouselPositionCount)
  const carouselRef = useRef(null)

  useVideoPreloader(preloadSources)

  const preloadAdjacentVideos = (index) => {
    const sources = [index - 1, index + 1]
      .filter((adjacentIndex) => adjacentIndex >= 0 && adjacentIndex < featuredUgc.length)
      .map((adjacentIndex) => featuredUgc[adjacentIndex].videos[0].src)

    setPreloadSources(sources)
  }

  const closeModal = () => {
    setPreloadSources([])
    setSelectedVideo(null)
  }

  useEffect(() => {
    const updateStickyHeaderHeight = () => {
      document.documentElement.style.setProperty('--sticky-header-height', `${getStickyHeaderHeight()}px`)
    }

    updateStickyHeaderHeight()
    window.addEventListener('resize', updateStickyHeaderHeight)
    return () => window.removeEventListener('resize', updateStickyHeaderHeight)
  }, [])

  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return undefined

    const syncCarouselPositions = () => {
      const { positionCount } = getCarouselMetrics(carousel)
      setCarouselPositionCount(positionCount)
      setActiveCard((currentPosition) => Math.min(currentPosition, positionCount - 1))
    }

    syncCarouselPositions()
    const resizeObserver = new ResizeObserver(syncCarouselPositions)
    resizeObserver.observe(carousel)
    return () => resizeObserver.disconnect()
  }, [])

  const scrollToFeatured = (event) => {
    event.preventDefault()
    const featuredSection = document.getElementById('featured-ugc')
    if (!featuredSection) return

    const offset = getStickyHeaderHeight()
    const targetTop = window.scrollY + featuredSection.getBoundingClientRect().top - offset
    window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
  }

  const moveCarousel = (direction) => {
    const carousel = carouselRef.current
    if (!carousel) return

    const { step, positionCount } = getCarouselMetrics(carousel)
    const nextPosition = Math.min(
      positionCount - 1,
      Math.max(0, activeCard + direction),
    )

    carousel.scrollTo({ left: nextPosition * step, behavior: 'smooth' })
    setCarouselPositionCount(positionCount)
    setActiveCard(nextPosition)
  }

  const updateActiveCard = (event) => {
    const carousel = event.currentTarget
    const { step, positionCount } = getCarouselMetrics(carousel)
    setCarouselPositionCount(positionCount)
    setActiveCard(Math.min(positionCount - 1, Math.max(0, Math.round(carousel.scrollLeft / step))))
  }

  return (
    <>
      <main>
        <section className="ugc-hero">
          <div className="ugc-hero__content">
            <p className="ugc-hero__identity">@medschoolwife <span aria-hidden="true">|</span> UGC</p>
            <h1>
              Relatable, natural-feeling content for brands that want to connect with <span className="ugc-hero__accent">real people</span>
            </h1>
            <p className="ugc-hero__detail">
              Creating for family, food, home, lifestyle, fashion, and beauty brands.
            </p>
            <a className="ugc-hero__button" href="#featured-ugc" onClick={scrollToFeatured}>View My Work</a>
          </div>

          <div className="ugc-hero__media">
            <img src={haileePortrait} alt="Hailee on a beach" width="1200" height="1800" fetchPriority="high" decoding="async" />
          </div>
        </section>

        <section id="featured-ugc" className="featured-ugc" aria-labelledby="featured-ugc-title">
          <div className="featured-ugc__heading">
            <p>Featured UGC</p>
            <h2 id="featured-ugc-title">Recent Work</h2>
          </div>
          <div className="featured-ugc__carousel-wrap">
            {activeCard > 0 && (
              <button
                className="featured-ugc__arrow featured-ugc__arrow--previous"
                type="button"
                aria-label="Show previous UGC projects"
                onClick={() => moveCarousel(-1)}
              >
                ←
              </button>
            )}
            <div
              ref={carouselRef}
              className="featured-ugc__carousel"
              onScroll={updateActiveCard}
              aria-label="Featured UGC carousel"
            >
            {featuredUgc.map((video, index) => (
              <button
                className="featured-ugc__card"
                key={video.title}
                type="button"
                onClick={() => setSelectedVideo(index)}
                aria-haspopup="dialog"
                aria-label={`Open ${video.title}`}
              >
                <UgcVideoPreview video={video.videos[0]} />
                <span className="featured-ugc__card-title">{video.title}</span>
                <span className="featured-ugc__card-category">{video.category}</span>
              </button>
            ))}
            </div>
            {activeCard < carouselPositionCount - 1 && (
              <button
                className="featured-ugc__arrow featured-ugc__arrow--next"
                type="button"
                aria-label="Show next UGC projects"
                onClick={() => moveCarousel(1)}
              >
                →
              </button>
            )}
          </div>
          <div className="featured-ugc__position" aria-label={`Carousel position ${activeCard + 1} of ${carouselPositionCount}`}>
            {Array.from({ length: carouselPositionCount }, (_, index) => (
              <span className={index === activeCard ? 'is-active' : ''} key={index}></span>
            ))}
          </div>
        </section>

        <section className="ugc-contact" aria-labelledby="ugc-contact-title">
          <div className="ugc-contact__inner">
            <p className="ugc-contact__eyebrow">GET IN TOUCH</p>
            <h2 id="ugc-contact-title">Ready to work together?</h2>
            <p className="ugc-contact__copy">I create UGC that feels natural, looks good, and<br />gives people a reason to stop scrolling.</p>
            <a className="ugc-hero__button ugc-contact__button" href="mailto:medschoolwife.collabs@gmail.com">
              <svg className="ugc-contact__button-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3.5 5.5h17v13h-17zM4.5 6.5 12 12l7.5-5.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
              </svg>
              Contact Me
            </a>
            <a className="ugc-contact__email" href="mailto:medschoolwife.collabs@gmail.com">medschoolwife.collabs@gmail.com</a>
          </div>
        </section>
      </main>
      {selectedVideo !== null && (
        <UgcModal
          key={selectedVideo}
          video={featuredUgc[selectedVideo]}
          onClose={closeModal}
          onPrevious={selectedVideo > 0 ? () => setSelectedVideo(selectedVideo - 1) : null}
          onNext={selectedVideo < featuredUgc.length - 1 ? () => setSelectedVideo(selectedVideo + 1) : null}
          onPlaybackStarted={() => preloadAdjacentVideos(selectedVideo)}
        />
      )}
    </>
  )
}

export default App

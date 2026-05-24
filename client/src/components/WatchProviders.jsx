import { motion } from 'framer-motion'
import { IMG } from '../services/tmdb'

// Порядок региональных фоллбеков для UZ-пользователя.
// TMDB отдаёт providers по регионам — UZ часто пустой, RU богаче, US фоллбек.
const REGION_PREFERENCE = ['UZ', 'RU', 'KZ', 'US']

const BUCKETS = [
  { key: 'flatrate', label: 'По подписке' },
  { key: 'rent',     label: 'Прокат' },
  { key: 'buy',      label: 'Покупка' },
]

function pickRegion(providers) {
  if (!providers?.results) return null
  for (const region of REGION_PREFERENCE) {
    const data = providers.results[region]
    if (data && (data.flatrate?.length || data.rent?.length || data.buy?.length)) {
      return { region, ...data }
    }
  }
  // Любой регион где есть хоть что-то
  for (const region of Object.keys(providers.results)) {
    const data = providers.results[region]
    if (data && (data.flatrate?.length || data.rent?.length || data.buy?.length)) {
      return { region, ...data }
    }
  }
  return null
}

export function WatchProviders({ providers }) {
  const data = pickRegion(providers)
  if (!data) return null

  // TMDB-страница на JustWatch со всеми ссылками. Безопаснее чем угадывать deeplink'и.
  const tmdbLink = data.link

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="mt-6 p-4 rounded-2xl bg-bg-elevated border border-border-subtle"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Где смотреть легально
          <span className="ml-2 text-xs font-normal text-text-muted normal-case">· регион {data.region}</span>
        </h3>
        {tmdbLink && (
          <a
            href={tmdbLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent-light hover:text-accent transition-colors"
          >
            Все варианты →
          </a>
        )}
      </div>

      <div className="space-y-3">
        {BUCKETS.map(({ key, label }) => {
          const list = data[key]
          if (!list?.length) return null
          return (
            <div key={key}>
              <p className="text-xs text-text-muted mb-2">{label}</p>
              <div className="flex flex-wrap gap-2">
                {list.map(p => (
                  <a
                    key={p.provider_id}
                    href={tmdbLink || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={p.provider_name}
                    className="group relative"
                  >
                    <img
                      src={IMG(p.logo_path, 'w92')}
                      alt={p.provider_name}
                      className="w-10 h-10 rounded-lg border border-border-subtle group-hover:border-accent transition-colors"
                    />
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-white/60 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {p.provider_name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </motion.section>
  )
}

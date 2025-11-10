import { DkanClient } from '@dkan-client-tools/core'
import { DkanClientProvider, useDatasetSearch, useDataset } from '@dkan-client-tools/react'
import { useState } from 'react'

// Create DKAN client instance
// Using empty baseUrl because Vite proxy will forward /api requests to DKAN
const dkanClient = new DkanClient({
  baseUrl: '',
  defaultOptions: {
    staleTime: 60000, // 1 minute
    cacheTime: 300000, // 5 minutes (maps to gcTime in TanStack Query v5)
  },
})

function DatasetList() {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null)

  const { data, isLoading, error, status, isFetching } = useDatasetSearch({
    searchOptions: {
      keyword: searchKeyword || undefined,
      'page-size': 10,
    },
    staleTime: 30000,
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          DKAN Client Tools Demo
        </h1>

        <div className="mb-8">
          <input
            type="text"
            placeholder="Search datasets by keyword..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-all duration-200 text-gray-900 placeholder-gray-500"
          />
        </div>

        {isLoading && (
          <p className="text-gray-700 text-lg">
            Loading datasets... (Status: {status})
          </p>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded" role="alert">
            <p className="text-red-800 font-medium">Error: {error.message}</p>
          </div>
        )}

        {isFetching && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-4">
            <p className="text-blue-800">Fetching data...</p>
          </div>
        )}

        {data && (
          <div>
            <p className="text-gray-700 text-lg mb-6">
              Found <span className="font-semibold text-gray-900">{data.total}</span> datasets
            </p>

            <div className="space-y-4">
              {data.results.map((dataset) => (
                <div
                  key={dataset.identifier}
                  onClick={() => setSelectedDatasetId(dataset.identifier)}
                  className={`
                    border-2 rounded-lg p-6 cursor-pointer transition-all duration-200
                    ${selectedDatasetId === dataset.identifier
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }
                  `}
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {dataset.title}
                  </h3>

                  {dataset.keyword && dataset.keyword.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {dataset.keyword.map((kw) => (
                        <span
                          key={kw}
                          className="inline-block px-3 py-1 bg-gray-200 text-gray-800
                                   text-sm font-medium rounded-full"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedDatasetId && (
          <div className="mt-12 pt-8 border-t-2 border-gray-300">
            <DatasetDetail datasetId={selectedDatasetId} />
          </div>
        )}
      </div>
    </div>
  )
}

function DatasetDetail({ datasetId }: { datasetId: string }) {
  const { data, isLoading, error } = useDataset({
    identifier: datasetId,
  })

  if (isLoading) {
    return <p className="text-gray-700 text-lg">Loading dataset details...</p>
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded" role="alert">
        <p className="text-red-800 font-medium">Error loading details: {error.message}</p>
      </div>
    )
  }

  if (!data) return null

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Dataset Details</h2>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Title
          </h3>
          <p className="text-gray-900 text-lg">{data.title}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Identifier
          </h3>
          <p className="text-gray-700 font-mono text-sm">{data.identifier}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Description
          </h3>
          <p className="text-gray-700 leading-relaxed">{data.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Modified
            </h3>
            <p className="text-gray-700">{data.modified}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Access Level
            </h3>
            <p className="text-gray-700 capitalize">{data.accessLevel}</p>
          </div>
        </div>

        {data.publisher && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Publisher
            </h3>
            <p className="text-gray-700">{data.publisher.name}</p>
          </div>
        )}

        {data.contactPoint && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Contact
            </h3>
            <div className="bg-gray-50 rounded p-4 space-y-1">
              <p className="text-gray-700">
                <span className="font-medium">Name:</span> {data.contactPoint.fn}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Email:</span>{' '}
                <a
                  href={`mailto:${data.contactPoint.hasEmail}`}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {data.contactPoint.hasEmail}
                </a>
              </p>
            </div>
          </div>
        )}

        {data.distribution && data.distribution.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Distributions
            </h3>
            <ul className="space-y-2">
              {data.distribution.map((dist, index) => (
                <li key={index} className="bg-gray-50 rounded p-3">
                  <span className="text-gray-900 font-medium">
                    {dist.title || 'Distribution'}
                  </span>
                  <span className="text-gray-600 ml-2">
                    ({dist.format || dist.mediaType})
                  </span>
                  {dist.downloadURL && (
                    <>
                      {' - '}
                      <a
                        href={dist.downloadURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline font-medium"
                      >
                        Download
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.theme && data.theme.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Themes
            </h3>
            <p className="text-gray-700">{data.theme.join(', ')}</p>
          </div>
        )}

        {data.license && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              License
            </h3>
            <p className="text-gray-700">{data.license}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <DkanClientProvider client={dkanClient}>
      <DatasetList />
    </DkanClientProvider>
  )
}

export default App

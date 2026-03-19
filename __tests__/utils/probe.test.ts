import { probeServer } from '@/utils/probe'

// Mock global fetch
const mockFetch = jest.fn()
globalThis.fetch = mockFetch

beforeEach(() => {
  jest.clearAllMocks()
})

describe('probeServer', () => {
  it('returns ok:true for HTTP 200', async () => {
    mockFetch.mockResolvedValue({ status: 200 })

    const result = await probeServer('https://ai.fr.ds.cc')

    expect(result).toEqual({ ok: true, status: 200 })
  })

  it('returns ok:true for HTTP 404 (any status = reachable)', async () => {
    mockFetch.mockResolvedValue({ status: 404 })

    const result = await probeServer('https://ai.fr.ds.cc')

    expect(result).toEqual({ ok: true, status: 404 })
  })

  it('returns ok:true for HTTP 500', async () => {
    mockFetch.mockResolvedValue({ status: 500 })

    const result = await probeServer('https://ai.fr.ds.cc')

    expect(result).toEqual({ ok: true, status: 500 })
  })

  it('returns ok:false when connection fails', async () => {
    mockFetch.mockRejectedValue(new TypeError('Network request failed'))

    const result = await probeServer('https://unreachable.invalid')

    expect(result).toEqual({
      ok: false,
      error: 'Network request failed',
    })
  })

  it('uses HEAD method for efficiency', async () => {
    mockFetch.mockResolvedValue({ status: 200 })

    await probeServer('https://ai.fr.ds.cc')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://ai.fr.ds.cc',
      expect.objectContaining({ method: 'HEAD' }),
    )
  })

  it('sets a timeout via AbortSignal', async () => {
    mockFetch.mockResolvedValue({ status: 200 })

    await probeServer('https://ai.fr.ds.cc')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://ai.fr.ds.cc',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it('returns ok:false on timeout (abort)', async () => {
    mockFetch.mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'))

    const result = await probeServer('https://slow.example.com')

    expect(result.ok).toBe(false)
    expect(result.error).toBeDefined()
  })
})

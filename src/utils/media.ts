// 获取音频或视频文件时长，统一返回秒数
export const getMediaDuration = (source: File | string): Promise<number> => {
  return new Promise((resolve, reject) => {
    const media = document.createElement('audio')
    const objectUrl = source instanceof File ? URL.createObjectURL(source) : ''
    const url = source instanceof File ? objectUrl : source

    const handleLoadedMetadata = () => {
      const duration = Number.isFinite(media.duration) ? Math.floor(media.duration) : 0
      cleanup()
      resolve(duration)
    }

    const handleError = () => {
      cleanup()
      reject(new Error('获取媒体时长失败'))
    }

    const cleanup = () => {
      media.removeEventListener('loadedmetadata', handleLoadedMetadata)
      media.removeEventListener('error', handleError)
      media.src = ''
      media.load()

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }

    media.preload = 'metadata'
    media.addEventListener('loadedmetadata', handleLoadedMetadata)
    media.addEventListener('error', handleError)
    media.src = url
  })
}

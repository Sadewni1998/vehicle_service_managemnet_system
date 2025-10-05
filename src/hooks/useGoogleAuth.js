import { useEffect, useState } from 'react'
import { GOOGLE_CONFIG } from '../config/googleAuth'

const useGoogleAuth = () => {
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Load Google OAuth script
    const loadGoogleScript = () => {
      if (window.google) {
        setIsGoogleLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CONFIG.clientId,
            callback: () => {}, // We'll handle this in the sign-in function
          })
          setIsGoogleLoaded(true)
        }
      }
      document.head.appendChild(script)
    }

    loadGoogleScript()
  }, [])

  const signInWithGoogle = () => {
    return new Promise((resolve, reject) => {
      if (!window.google || !isGoogleLoaded) {
        reject(new Error('Google OAuth not loaded'))
        return
      }

      setIsLoading(true)

      // Use Google OAuth2 popup flow
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CONFIG.clientId,
        scope: 'openid email profile',
        callback: async (response) => {
          try {
            if (response.access_token) {
              // Get user info using the access token
              const userInfoResponse = await fetch(
                `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`
              )
              const userInfo = await userInfoResponse.json()
              
              // Create a proper JWT-like token for our backend
              // We'll send the user info directly since we have it
              const tokenData = {
                sub: userInfo.id,
                name: userInfo.name,
                email: userInfo.email,
                picture: userInfo.picture,
                access_token: response.access_token
              }
              
              resolve(JSON.stringify(tokenData))
              setIsLoading(false)
            } else {
              reject(new Error('No access token received'))
              setIsLoading(false)
            }
          } catch (error) {
            reject(error)
            setIsLoading(false)
          }
        }
      })

      // Request access token (this opens the popup)
      client.requestAccessToken()
    })
  }

  return {
    isGoogleLoaded,
    isLoading,
    signInWithGoogle
  }
}

export default useGoogleAuth

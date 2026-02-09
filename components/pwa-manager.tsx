"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

const IOS_REGEX = /iPad|iPhone|iPod/

function isTouchMac(): boolean {
  if (typeof navigator === "undefined") return false
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1
}

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    return false
  }

  const ua = navigator.userAgent
  const mobileUA =
    /Android|webOS|BlackBerry|IEMobile|Opera Mini|Mobi|Mobile/i.test(ua) ||
    IOS_REGEX.test(ua) ||
    isTouchMac()

  const narrowViewport = window.matchMedia("(max-width: 1024px)").matches
  const touchPointer = window.matchMedia("(pointer: coarse)").matches

  return mobileUA || (narrowViewport && touchPointer)
}

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  )
}

export function PwaManager() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showDesktopBlock, setShowDesktopBlock] = useState(false)
  const [showIosHint, setShowIosHint] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  const canInstall = useMemo(
    () => !isInstalled && installPrompt !== null && !showDesktopBlock,
    [installPrompt, isInstalled, showDesktopBlock],
  )

  useEffect(() => {
    const updatePlatformState = () => {
      const mobile = isMobileDevice()
      const standalone = isStandaloneMode()

      setIsInstalled(standalone)
      setShowDesktopBlock(!mobile)

      const ua = navigator.userAgent
      const isIos = IOS_REGEX.test(ua) || isTouchMac()
      setShowIosHint(mobile && isIos && !standalone)
    }

    updatePlatformState()
    window.addEventListener("resize", updatePlatformState)
    window.addEventListener("orientationchange", updatePlatformState)
    return () => {
      window.removeEventListener("resize", updatePlatformState)
      window.removeEventListener("orientationchange", updatePlatformState)
    }
  }, [])

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    const registerServiceWorker = async () => {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      })

      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" })
      }

      registration.addEventListener("updatefound", () => {
        const installing = registration.installing
        if (!installing) return

        installing.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            if (registration.waiting) {
              registration.waiting.postMessage({ type: "SKIP_WAITING" })
            }
          }
        })
      })
    }

    void registerServiceWorker().catch(() => undefined)
  }, [])

  useEffect(() => {
    const onControllerChange = () => {
      window.location.reload()
    }

    navigator.serviceWorker?.addEventListener("controllerchange", onControllerChange)
    return () =>
      navigator.serviceWorker?.removeEventListener(
        "controllerchange",
        onControllerChange,
      )
  }, [])

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setInstallPrompt(null)
      setIsInstalled(true)
      setShowIosHint(false)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return

    await installPrompt.prompt()
    const choice = await installPrompt.userChoice

    if (choice.outcome === "accepted") {
      setInstallPrompt(null)
    }
  }

  return (
    <>
      {canInstall ? (
        <div className="fixed bottom-20 right-4 z-[90] w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border bg-card p-4 shadow-xl">
          <p className="text-sm font-medium text-foreground">Instalar app</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Instale o MercadoApp na tela inicial para uma experiencia completa.
          </p>
          <Button className="mt-3 w-full" onClick={handleInstall}>
            Instalar agora
          </Button>
        </div>
      ) : null}

      {showIosHint && !showDesktopBlock ? (
        <div className="fixed bottom-20 right-4 z-[90] w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border bg-card p-4 shadow-xl">
          <p className="text-sm font-medium text-foreground">Instalar no iPhone</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Abra o menu de compartilhamento do navegador e toque em "Adicionar
            a Tela de Inicio".
          </p>
        </div>
      ) : null}

      {showDesktopBlock ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 text-center shadow-2xl">
            <img
              src="/logo.png"
              alt="MercadoApp"
              className="mx-auto mb-4 h-16 w-16 rounded-2xl object-cover"
            />
            <h2 className="text-lg font-semibold text-foreground">
              Uso disponivel apenas no mobile
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Este app foi otimizado para Android e iOS. Acesse pelo celular e
              instale na tela inicial para continuar.
            </p>
          </div>
        </div>
      ) : null}
    </>
  )
}

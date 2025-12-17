'use client';

import { useEffect } from 'react';
import { useAccount, useConnect, useChainId, useSwitchChain } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { ProfileDropdown } from './ProfileDropdown';
import { useNetwork } from '../app/contexts/NetworkContext';

export function Header() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { mode, chain } = useNetwork();

  // Switch chain when mode changes
  useEffect(() => {
    if (isConnected && chainId !== chain.id) {
      // Auto-switch chain when mode changes
      switchChain({ chainId: chain.id });
    }
  }, [mode, chain.id, chainId, isConnected, switchChain]);

  return (
    <header className="border-b border-zinc-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="h-[40px] sm:h-[49px] w-auto flex items-center flex-shrink-0">
              <svg viewBox="0 0 130 49" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" className="h-[40px] sm:h-[49px] w-auto">
                <path d="M118.324 0.576478C119.014 0.57648 119.674 0.858802 120.15 1.35771L126.665 8.18262C127.114 8.65205 127.364 9.27606 127.364 9.92498V14.0753C127.364 14.7331 127.107 15.365 126.648 15.8362L102.833 40.2826C102.719 40.4004 102.654 40.5585 102.654 40.723V43.688C102.654 44.0365 102.937 44.3189 103.285 44.3189H126.733C127.081 44.3189 127.364 44.6014 127.364 44.9498V48.3146C127.364 48.6631 127.081 48.9455 126.733 48.9455H100.551C99.1568 48.9455 98.0265 47.8156 98.0265 46.4219V39.6113C98.0265 38.9537 98.2834 38.322 98.7424 37.8507L122.557 13.4044C122.672 13.2866 122.736 13.1285 122.736 12.9641V11.0204C122.736 10.8582 122.674 10.7022 122.562 10.5848L117.61 5.39839C117.491 5.27368 117.326 5.20311 117.154 5.20308H107.232C107.065 5.20308 106.904 5.26962 106.786 5.38792L100.787 11.3854C100.54 11.6318 100.141 11.6318 99.8943 11.3854L97.5143 9.00595C97.268 8.75956 97.2682 8.36018 97.5145 8.11381L104.314 1.31561C104.788 0.842371 105.43 0.576499 106.099 0.576478H118.324ZM83.3191 0.576478C87.966 0.576478 91.7333 4.34266 91.7333 8.98849V40.5316L91.7306 40.7489C91.6172 45.2222 88.0106 48.8275 83.5362 48.9409L83.3191 48.9436H72.9752L72.7581 48.9409C68.2837 48.8275 64.6771 45.2222 64.5637 40.7489L64.561 40.5316V8.98849C64.561 4.3427 68.3283 0.57653 72.9752 0.576478H83.3191ZM52.3016 0C52.65 3.30462e-05 52.9327 0.282507 52.9327 0.630901V21.1508C52.9327 21.4992 53.2152 21.7817 53.5638 21.7817H58.0944C58.443 21.7817 58.7255 22.0643 58.7255 22.4126V25.7774C58.7255 26.1258 58.443 26.4083 58.0944 26.4083H53.5638C53.2152 26.4083 52.9327 26.6907 52.9327 27.0392V48.3125C52.9327 48.661 52.6502 48.9434 52.3016 48.9434H48.936C48.5874 48.9434 48.3049 48.661 48.3049 48.3125V27.0392C48.3049 26.6909 48.0222 26.4083 47.6738 26.4083H31.7606C31.5936 26.4083 31.4333 26.342 31.3149 26.224L25.8201 20.745C25.5736 20.4991 25.573 20.1 25.8185 19.8533L45.3973 0.185861C45.5158 0.0669252 45.6769 2.54743e-05 45.8446 0H52.3016ZM2.91808 15.5368C3.0823 15.3729 3.34834 15.3729 3.51257 15.5368L16.8285 28.8242L21.9405 23.7377C22.1048 23.5743 22.3705 23.5743 22.5346 23.7381L25.1542 26.3521C25.3191 26.5166 25.3187 26.7839 25.1535 26.9481L21.3757 30.7036V33.4247L33.3587 45.3822C33.5234 45.5464 33.5234 45.8133 33.3587 45.9776L30.7389 48.5918C30.5746 48.7556 30.3087 48.7556 30.1444 48.5918L16.8285 35.3044L3.51257 48.5918C3.34834 48.7556 3.0823 48.7556 2.91808 48.5918L0.298278 45.9776C0.133648 45.8133 0.133677 45.5464 0.298278 45.3822L12.2812 33.4247V30.7036L0.298278 18.7463C0.133677 18.582 0.13365 18.3152 0.298278 18.1509L2.91808 15.5368ZM69.1888 37.8011V40.5316C69.1888 42.6222 70.8841 44.317 72.9752 44.317H83.3191C85.4102 44.317 87.1055 42.6222 87.1055 40.5316V19.8892L69.1888 37.8011ZM72.9752 5.20308C70.8841 5.20315 69.1888 6.8979 69.1888 8.98849V31.2582L87.1055 13.3463V8.98849C87.1055 6.89787 85.4102 5.20308 83.3191 5.20308H72.9752ZM47.7403 4.62661C47.5903 4.62663 47.4462 4.68659 47.3404 4.79296L32.3597 19.8412C32.114 20.0879 32.1148 20.487 32.3614 20.7329L33.2283 21.5974C33.3465 21.7154 33.507 21.7817 33.674 21.7817H47.6738C48.0224 21.7817 48.3049 21.4992 48.3049 21.1508V5.19076C48.3049 4.8792 48.052 4.62661 47.7403 4.62661Z" fill="white"></path>
              </svg>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-zinc-100">
                X Monad
              </h1>
              <p className="text-[10px] sm:text-xs text-zinc-500">
                {mode === "dev" ? "Monad Testnet" : "Monad Mainnet"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            {isConnected ? (
              <ProfileDropdown />
            ) : (
              <Button
                onClick={() => connect({ connector: connectors[0] })}
                className="bg-zinc-100 text-black hover:bg-zinc-200 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 h-auto"
              >
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Connect Wallet</span>
                <span className="sm:hidden">Connect</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
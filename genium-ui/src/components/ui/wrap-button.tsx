import React from "react"
import { ArrowRight, Globe } from "lucide-react"

// Simple cn utility for joining class names
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

interface WrapButtonProps {
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

const WrapButton: React.FC<WrapButtonProps> = ({
  className,
  children,
  onClick,
}) => {
  return (
    <div className="flex items-center justify-center">
      <button
        type="button"
        className={cn(
          "group cursor-pointer border group border-[#3B3A3A] bg-[#151515] gap-2  h-[64px] flex items-center p-[11px] rounded-full",
          className
        )}
        onClick={onClick}
      >
        <div className="border border-[#3B3A3A] bg-[#fe7500]  h-[43px] rounded-full flex items-center justify-center text-white">
          <Globe className="mx-2 animate-spin " />
          <p className="font-medium tracking-tight mr-3">
            {children ? children : "Get Started"}
          </p>
        </div>
        <div className="text-[#3b3a3a] group-hover:ml-2  ease-in-out transition-all size-[26px] flex items-center justify-center rounded-full border-2 border-[#3b3a3a]  ">
          <ArrowRight
            size={18}
            className="group-hover:rotate-45 ease-in-out transition-all "
          />
        </div>
      </button>
    </div>
  )
}

export { WrapButton } 
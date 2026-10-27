import React from "react"
import Icon from "../ui/icon"
import type { IconName } from "../ui/icon-names"

type Props = {
  icon: IconName
  title: string
  description: React.ReactNode
  badge?: React.ReactNode
  children: React.ReactNode
}

const Section = ({ icon, title, description, badge, children }: Props) => (
  <section className="rounded-2xl bg-surface-container-low p-5 sm:p-6 flex flex-col gap-5 shadow-md">
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center">
          <Icon name={icon} className="text-[22px]" />
        </div>
        <div className="flex flex-col min-w-0">
          <h2 className="text-headline-sm text-on-surface">{title}</h2>
          <div className="text-body-sm text-on-surface-variant max-w-xl">{description}</div>
        </div>
      </div>
      {badge}
    </div>
    {children}
  </section>
)

export default Section

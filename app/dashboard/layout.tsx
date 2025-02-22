import React from 'react'
import SidebarLayout from './_components/sidebarLayout'

function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarLayout>
      {children}
    </SidebarLayout>
  )
}

export default DashboardLayout

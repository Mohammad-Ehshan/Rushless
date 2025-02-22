import { connectToDB } from '@/lib/db'
import React from 'react'
import { getStreetFromAddress } from '@/lib/utils'
import { ParkingLocation, ParkingLocationModel } from '@/schemas/parkingLocations'
import LocationCard from './_components/locationCard'

async function LocationsTileViewPage() {

  await connectToDB()

  const locations: ParkingLocation[] = await ParkingLocationModel.find({}) as [ParkingLocation]

  return (
    <div className='grid lg:grid-cols-4 md:grid-cols-2 gap-2 p-2'>
      {
        locations.map(location => (
          <LocationCard
            key={location.id}
            id={location.id}
            name={getStreetFromAddress(location.address)}
            address={location.address}
            numberOfSpots={location.numberofspots}
            spotsAvailable={4}
            spotsBooked={6}
            status={location.status}
            price={location.price}
          />
        ))
      }
    </div>

  )
}

export default LocationsTileViewPage
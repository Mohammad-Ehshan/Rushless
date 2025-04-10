import AddressAutoCompleteInput from '@/components/address-autocomplete.input'
import { Button } from '@/components/ui/button'
import { useMySpotStore } from '@/store'
import { LatLng, ListSpotPropsType } from '@/types'
import React, { useState } from 'react'

function SpotAddress({onNext}:ListSpotPropsType) {
  
  const mySpotStore = useMySpotStore()
  const [message, setMessage] = useState<string>("")

  function onSubmit() {
    if(mySpotStore.data.address) {
      onNext()
    }else {
      setMessage("Address is Required")
    }
  }

  const handleAddressSelect= (address: string, gpscoords:LatLng) => {
    setMessage("")
    mySpotStore.updateState({address:address, gpscoords:gpscoords})
  }

  return (
   <div className='grid w-full gap-1.5'>
    <h2 className='texl-lg font-semibold py-4 sm:text-2xl'>Address</h2>
    <AddressAutoCompleteInput onAddressSelect={handleAddressSelect} selectedAddress={mySpotStore.data.address}/>
    <p className='text-red-500 text-sm'>{message}</p>
    <div className='flex justify-between py-4'>
    <Button type='button' variant='secondary' onClick={onSubmit}>Next</Button>
    </div>
   </div>
  )
}

export default SpotAddress

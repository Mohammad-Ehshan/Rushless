
// import { LatLng } from '@/types'
// import React, { useEffect, useRef, useState } from 'react'
// import { useJsApiLoader } from '@react-google-maps/api'
// import { libs } from '@/lib/utils'
// import { Input } from './ui/input'

// type AddressAutoCompleteInputProps = {
//     onAddressSelect: (address: string, gpscoords: LatLng) => void,
//     selectedAddress?: string
// }   

// function AddressAutoCompleteInput({
//     onAddressSelect, selectedAddress
// } : AddressAutoCompleteInputProps) {

//     const [autoComplete, setAutoComplete] = 
//     useState<google.maps.places.Autocomplete | null>(null)

//     const { isLoaded } = useJsApiLoader({
//         nonce: "477d4456-f7b5-45e2-8945-5f17b3964752", 
//         googleMapsApiKey: "AlzaSyaymA-b9AUSRmjzk-Dz31GjQUbtAmGyK2Y",
//         libraries: libs
//     })

//     const placesAutoCompleteRef = useRef<HTMLInputElement>(null)

//     useEffect(() => {

//         if (isLoaded) {
//             const ontarioBounds = new google.maps.LatLngBounds(
//               new google.maps.LatLng({ lat: 28.4039, lng: 76.8414 }), // Example: Near Gurgaon, Haryana

//               new google.maps.LatLng({ lat: 28.8830, lng: 77.2830 }) // Example: Near Ghaziabad, Uttar Pradesh
//             )

//             const gAutoComplete  = new google.maps.places.Autocomplete(placesAutoCompleteRef.current as HTMLInputElement, {
//                 bounds: ontarioBounds,
//                 fields: ['formatted_address', 'geometry'],
//                 componentRestrictions: {
//                     country: ['IN']
//                 }
//             })

//             gAutoComplete.addListener('place_changed', () => {
//                 const place = gAutoComplete.getPlace()
//                 const position = place.geometry?.location
//                 onAddressSelect(place.formatted_address!, {
//                     lat: position?.lat()!,
//                     lng: position?.lng()!
//                 })
//             })
//         }
//     }, [isLoaded])

//     useEffect(() => {
//         // https://github.com/radix-ui/primitives/issues/1859
//         // Disable Radix ui dialog pointer events lockout
//         setTimeout(() => (document.body.style.pointerEvents = ""), 0)
//     })

//   return (
//     <Input ref={placesAutoCompleteRef} defaultValue={selectedAddress} />
//   )
// }

// export default AddressAutoCompleteInput


import React, { useEffect, useRef, useState } from 'react';
import { LatLng } from '@/types'; // Custom LatLng type
import { Input } from './ui/input';

type AddressAutoCompleteInputProps = {
  onAddressSelect: (address: string, gpscoords: LatLng) => void;
  selectedAddress?: string;
};

function AddressAutoCompleteInput({
  onAddressSelect,
  selectedAddress,
}: AddressAutoCompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]); // To store autocomplete results
  const [searching, setSearching] = useState(false); // Loading state

  // Fetch autocomplete suggestions from Nominatim
  const fetchSuggestions = async (query: string) => {
    setSearching(true);
    try {

      //for india
      // const response = await fetch(
      //   `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      //     query
      //   )}&format=json&addressdetails=1&countrycodes=in&limit=5`
      // );

      //for delhi
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&countrycodes=in&limit=5&viewbox=76.8,28.9,77.3,28.4&bounded=1`
      );

      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setSearching(false);
    }
  };

  // Handle input change to fetch suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    if (query.length > 2) {
      fetchSuggestions(query);
    } else {
      setSuggestions([]);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: any) => {
    const { display_name, lat, lon } = suggestion;

     // Update input field manually
  if (inputRef.current) {
    inputRef.current.value = display_name;
  }

      // Pass selected address and coordinates to parent
    onAddressSelect(display_name, { lat: parseFloat(lat), lng: parseFloat(lon) });

     // Clear suggestions after selection
    setSuggestions([]);
  };

  return (
    <div>
      <Input
        ref={inputRef}
        defaultValue={selectedAddress}
        onChange={handleInputChange}
        placeholder="Enter an address"
      />
      {searching && <p>Loading suggestions...</p>}
      {suggestions.length > 0 && (
        <ul className="absolute z-10 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSuggestionSelect(suggestion)}
              className="cursor-pointer px-4 py-2 hover:bg-gray-100"
            >
              {suggestion.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AddressAutoCompleteInput;

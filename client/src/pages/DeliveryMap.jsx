import React from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';

const DeliveryMap = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Delivery Map</h1>
            <div className="bg-white rounded-lg shadow p-6">
                <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                        <FaMapMarkerAlt className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-lg">Map Integration</p>
                        <p className="text-sm">(Google Maps / Mapbox would appear here)</p>
                        <p className="text-xs mt-2">Shows all delivery locations with routing</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryMap;

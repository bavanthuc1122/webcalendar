'use client';

import { useState, useCallback } from 'react';
import BookingInput from '../components/BookingInput';
import ParsedReviewForm from '../components/ParsedReviewForm';

export default function Home() {
  const [parsedData, setParsedData] = useState(null);

  const handleParsedData = (data) => {
    setParsedData(data);
  };

  const handleBack = useCallback(() => {
    setParsedData(null);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="w-full max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">Web Calendar Booking</h1>
        
        {!parsedData ? (
          <BookingInput onParsedData={handleParsedData} />
        ) : (
          <ParsedReviewForm data={parsedData} onBack={handleBack} />
        )}
      </div>
    </main>
  );
}
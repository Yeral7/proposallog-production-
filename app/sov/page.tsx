import React from "react";
import Banner from "../../components/Banner";
import Header from "../../components/Header";

export default function SOVPage() {
  return (
    <main>
      <Header />
      <Banner title="Schedule of Values (SOV)" />
      <div className="p-4">
        <p>Content for Schedule of Values will go here.</p>
      </div>
    </main>
  );
}

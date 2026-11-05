export default function MapPage() {
  return (
    <>
      <div className="page-head">
        <h1>Network map</h1>
        <p>
          The Pink and Blue lines shown here are not in the planner yet. It covers the Purple, Green
          and Yellow lines.
        </p>
      </div>
      <figure className="network-image">
        <a href="/map.jpeg" target="_blank" rel="noreferrer">
          <img src="/map.jpeg" alt="Map of the Bangalore metro showing the Purple, Green, Yellow, Pink and Blue lines" />
        </a>
        <figcaption>Metro Map 2025 by Nihar Thakkar. Select the map to open it at full size.</figcaption>
      </figure>
    </>
  );
}

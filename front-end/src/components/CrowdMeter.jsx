import { crowdBand } from '../lib/crowd';

// Three bars rather than line colours, because green and yellow already mean
// a metro line here. The word and the number are always shown too.
export default function CrowdMeter({ level }) {
  const band = crowdBand(level);
  return (
    <span className={`crowd crowd--${band.toLowerCase()}`}>
      <span className="crowd__bars" aria-hidden="true"><i /><i /><i /></span>
      <span className="crowd__text">{band} {level}%</span>
    </span>
  );
}

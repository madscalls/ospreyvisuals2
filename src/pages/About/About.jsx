import PagePlaceholder from '../../components/PagePlaceholder/PagePlaceholder.jsx';
import './About.css';

export default function About() {
  return (
    <div className="page-about">
      <PagePlaceholder
        eyebrow="Who we are"
        title="About"
        intro="The team and the story behind Osprey Visuals."
      />
    </div>
  );
}

import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Karachi only · every listing visited in person</p>
      <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
        Book a verified farmhouse, with no double bookings.
      </h1>
      <p className="mt-4 max-w-xl text-lg text-gray-600">
        Every farmhouse on Bookmyfarm.pk is inspected by our team before it goes live. Check real availability and
        get a confirmed booking with proof.
      </p>
      <div className="mt-8 flex gap-3">
        <Link to="/farmhouses" className="btn">Find a farmhouse</Link>
        <Link to="/register?role=owner" className="rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-100">
          List your farmhouse
        </Link>
      </div>
    </section>
  );
}

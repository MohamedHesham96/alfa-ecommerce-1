import { MdInsights } from "react-icons/md";

export default function SectionEmpty({ title, description, icon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-9 text-center">
      <span className="admin-empty-icon" aria-hidden="true">
        {icon || <MdInsights />}
      </span>
      <p className="admin-empty-title">{title}</p>
      {description ? (
        <p className="admin-empty-description">{description}</p>
      ) : null}
    </div>
  );
}

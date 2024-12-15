import React from "react";

type SortOptionsProps = {
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  defaultValue: string;
};

const SortOptions: React.FC<SortOptionsProps> = ({
  onChange,
  defaultValue,
}) => {
  return (
    <div className="">
      <select
        name="sortOptions"
        id=""
        onChange={onChange}
        defaultValue={defaultValue ?? "name"}
        className="bg-slate-800 p-2 rounded-md outline-none"
      >
        <option value="size" selected={defaultValue === "size"}>
          Size
        </option>
        <option value="name" selected={defaultValue === "name"}>
          Name
        </option>
      </select>
    </div>
  );
};

export default SortOptions;

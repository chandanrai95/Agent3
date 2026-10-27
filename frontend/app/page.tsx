import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center font-sans  w-full">
      <div className="flex flex-col flex-1 items-center justify-center gap-2">
        <div className="relative w-24 h-24 rounded-3xl bg-white dark:bg-surface-dark shadow-2xl flex items-center justify-center border border-white mb-2">
          <span className="material-icons-round text-xl ">auto_awesome_motion</span>
        </div>
        <span className="font-bold text-3xl" >Agent  not selected</span>
        <span className="text-center text-gray-600 text-lg">Select a agent from your list <br /> Create a new agent <br /> To get started.</span>
      </div>
    </div>
  );
}

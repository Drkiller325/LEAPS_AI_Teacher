import { teachers, useAITeacher } from "@/hooks/useAITeacher";

export const BoardSettings = () => {
  const furigana = useAITeacher((state) => state.furigana);
  const setFurigana = useAITeacher((state) => state.setFurigana);

  const english = useAITeacher((state) => state.english);
  const setEnglish = useAITeacher((state) => state.setEnglish);

  const teacher = useAITeacher((state) => state.teacher);
  const setTeacher = useAITeacher((state) => state.setTeacher);

  const speech = useAITeacher((state) => state.speech);
  const setSpeech = useAITeacher((state) => state.setSpeech);

  const classroom = useAITeacher((state) => state.classroom);
  const setClassroom = useAITeacher((state) => state.setClassroom);

  return (
    <>
      <div className="absolute right-0 bottom-full flex flex-row gap-10 mb-20">
        {teachers.map((sensei, idx) => (
          <div
            key={idx}
            className={`p-3 transition-colors duration-500 ${
              teacher === sensei ? "bg-white/50" : "bg-white/40"
            }`}
          >
            <div onClick={() => setTeacher(sensei)}>
              <img
                src={`/teachers/${sensei}.jpg`}
                alt={sensei}
                className="object-cover w-40 h-40 rounded-lg shadow-lg hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h2 className="text-3xl font-bold mt-3 text-center text-white">{sensei}</h2>
          </div>
        ))}
      </div>
      <div className="absolute left-0 bottom-full flex flex-col gap-4 mb-20 -ml-20">
        <button
          className={` ${
            classroom === "default"
              ? "text-white bg-slate-900/40 "
              : "text-white/45 bg-slate-700/20 "
          } py-4 px-10 text-4xl rounded-full transition-colors duration-500 backdrop-blur-md hover:bg-slate-800/50`}
          onClick={() => setClassroom("math")}
        >
          math classroom
        </button>
        <button
          className={` ${
            classroom === "history"
              ? "text-white bg-slate-900/40 "
              : "text-white/45 bg-slate-700/20 "
          } py-4 px-10 text-4xl rounded-full transition-colors duration-500 backdrop-blur-md hover:bg-slate-800/50`}
          onClick={() => setClassroom("history")}
        >
          History classroom
        </button>
      </div>
      <div className="absolute left-0 top-full flex flex-row gap-2 mt-20">
        <button
          className={` ${
            speech === "formal"
              ? "text-white bg-slate-900/40 "
              : "text-white/45 bg-slate-700/20 "
          } py-4 px-10 text-4xl rounded-full transition-colors duration-500 backdrop-blur-md hover:bg-slate-800/50`}
          onClick={() => setSpeech("formal")}
        >
          Formal
        </button>
        <button
          className={` ${
            speech === "casual"
              ? "text-white bg-slate-900/40 "
              : "text-white/45 bg-slate-700/20 "
          } py-4 px-10 text-4xl rounded-full transition-colors duration-500 backdrop-blur-md hover:bg-slate-800/50`}
          onClick={() => setSpeech("casual")}
        >
          Casual
        </button>
      </div>
      <div className="absolute right-0 top-full flex flex-row gap-2 mt-20">
        <button
          className={` ${
            furigana
              ? "text-white bg-slate-900/40 "
              : "text-white/45 bg-slate-700/20 "
          } py-4 px-10 text-4xl rounded-full transition-colors duration-500 backdrop-blur-md hover:bg-slate-800/50`}
          onClick={() => setFurigana(!furigana)}
        >
          Furigana
        </button>
        <button
          className={`${
            english
              ? "text-white bg-slate-900/40 "
              : "text-white/45 bg-slate-700/20 "
          } py-4 px-10 text-4xl rounded-full transition-colors duration-500 backdrop-blur-md hover:bg-slate-800/50`}
          onClick={() => setEnglish(!english)}
        >
          English
        </button>
      </div>
    </>
  );
};

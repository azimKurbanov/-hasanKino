import { redirect } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

/**
 * /lobby/[code] — получает данные лобби и перенаправляет
 * на страницу фильма/сериала с параметром ?lobby=CODE
 */
export default async function LobbyJoinPage({ params }) {
  const { code, locale } = await params;

  let lobby;
  try {
    const res = await fetch(`${API_URL}/api/lobby/${code.toUpperCase()}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Not found");
    lobby = await res.json();
  } catch {
    // Лобби не найдено — на главную
    redirect(`/${locale}`);
  }

  const path = lobby.movieType === "tv"
    ? `/${locale}/series/${lobby.movieId}?lobby=${code}`
    : `/${locale}/movies/${lobby.movieId}?lobby=${code}`;

  redirect(path);
}

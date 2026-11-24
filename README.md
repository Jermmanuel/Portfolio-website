# JeromeOS: Portfolio Website

My personal portfolio, built to look and work like a desktop operating system. Visitors open "apps" for my About page, projects, resume and contact info, browse projects by category, and can play a few small browser games.

## Features

- **Desktop-style UI:** draggable app windows, desktop icons, a start menu and a command palette
- **Project browser:** filter projects by category and open a detail panel for each one
- **AURA assistant:** a scripted guide that gives visitors a tour of the site
- **Games:** three small JavaScript games (aim, click and dodge)
- **Resume and contact:** downloadable resume PDF plus links to LinkedIn, GitHub and email

## Tech stack

- C# and ASP.NET Core Razor Pages (.NET 8)
- JavaScript and CSS for the OS-style interface
- Bootstrap

## Run it locally

Requires the [.NET 8 SDK](https://dotnet.microsoft.com/download).

```bash
git clone https://github.com/Jermmanuel/Portfolio-website.git
cd Portfolio-website
dotnet run
```

Then open the URL shown in the terminal.

## Project structure

```
Pages/            Razor Pages (Index.cshtml holds the desktop and app windows)
wwwroot/js/os.js  Window manager, project browser, AURA and command palette
wwwroot/css/      Styles for the OS interface
wwwroot/games/    Browser games
wwwroot/assets/   Resume PDF
```

## Contact

- LinkedIn: [jerome-ewohime](https://www.linkedin.com/in/jerome-ewohime)
- Email: jewohime@icloud.com

-- CreateTable
CREATE TABLE "Lecture" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lec_name" TEXT NOT NULL,
    "teacher" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "grade" INTEGER NOT NULL,
    "term" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "LecEval" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lecture_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "attendance" INTEGER NOT NULL,
    "assignments" INTEGER NOT NULL,
    "exam_difficulty" INTEGER NOT NULL,
    "clarity" INTEGER NOT NULL,
    "interest" INTEGER NOT NULL,
    "easy_credit" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "LecEval_lecture_id_fkey" FOREIGN KEY ("lecture_id") REFERENCES "Lecture" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LecEval_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "user_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "course" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "LecEval_lecture_id_user_id_key" ON "LecEval"("lecture_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

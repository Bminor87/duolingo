<?php

use App\Http\Controllers\LessonController;
use App\Http\Controllers\PathController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\StatisticsController;
use App\Http\Controllers\VocabularyController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard')->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', [PathController::class, 'index'])->name('dashboard');

    Route::get('lessons/{lessonId}', [LessonController::class, 'show'])->name('lessons.show');
    Route::post('lessons/{lessonId}/complete', [LessonController::class, 'complete'])->name('lessons.complete');

    Route::get('review', [ReviewController::class, 'show'])->name('review.show');
    Route::post('review/complete', [ReviewController::class, 'complete'])->name('review.complete');

    Route::get('statistics', [StatisticsController::class, 'index'])->name('statistics');
    Route::get('vocabulary', [VocabularyController::class, 'index'])->name('vocabulary');
});

require __DIR__.'/settings.php';

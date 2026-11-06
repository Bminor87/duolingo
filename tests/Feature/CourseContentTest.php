<?php

use App\Course\CourseValidator;

test('the course content is valid and every swedish word has a glossary entry', function () {
    $errors = (new CourseValidator(resource_path('course')))->validate();

    expect($errors)->toBe([]);
});

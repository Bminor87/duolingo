<?php

use App\Models\User;

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register and are logged in', function () {
    $response = $this->post(route('register.store'), [
        'username' => 'New_User',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertRedirect(route('dashboard', absolute: false));

    $user = User::sole();
    expect($user->username)->toBe('new_user');
    $this->assertAuthenticatedAs($user);
});

test('users can not register with a username that is already taken', function () {
    User::factory()->create(['username' => 'taken']);

    $response = $this->post(route('register.store'), [
        'username' => 'TAKEN',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertSessionHasErrors(['username' => 'The username has already been taken.']);
    $this->assertGuest();
});

test('users can not register with an invalid username', function (string $username, string $message) {
    $response = $this->post(route('register.store'), [
        'username' => $username,
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertSessionHasErrors(['username' => $message]);
    $this->assertGuest();
})->with([
    'too short' => ['ab', 'The username field must be at least 3 characters.'],
    'invalid characters' => ['john doe', 'The username field must only contain letters, numbers, dashes, and underscores.'],
]);

test('users can not register without a confirmed password', function () {
    $response = $this->post(route('register.store'), [
        'username' => 'new_user',
        'password' => 'password',
        'password_confirmation' => 'different',
    ]);

    $response->assertSessionHasErrors(['password' => 'The password field confirmation does not match.']);
    $this->assertGuest();
});

<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;

trait ProfileValidationRules
{
    /**
     * Get the validation rules used to validate user profiles.
     *
     * @return array<string, array<int, Unique|ValidationRule|array<mixed>|string>>
     */
    protected function profileRules(?int $userId = null): array
    {
        return [
            'username' => $this->usernameRules($userId),
        ];
    }

    /**
     * Get the validation rules used to validate usernames.
     *
     * @return array<int, Unique|ValidationRule|array<mixed>|string>
     */
    protected function usernameRules(?int $userId = null): array
    {
        return [
            'required',
            'string',
            'min:3',
            'max:32',
            'alpha_dash:ascii',
            $userId === null
                ? Rule::unique(User::class)
                : Rule::unique(User::class)->ignore($userId),
        ];
    }

    /**
     * Normalize a username so lookups and uniqueness are case-insensitive.
     */
    protected function normalizeUsername(mixed $username): mixed
    {
        return is_string($username) ? mb_strtolower(trim($username)) : $username;
    }
}

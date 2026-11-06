<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CompleteSessionRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'results' => ['required', 'array', 'min:1', 'max:100'],
            'results.*.item_id' => ['required', 'string', 'max:64', 'distinct'],
            'results.*.correct' => ['required', 'boolean'],
            'exercises_total' => ['required', 'integer', 'min:1', 'max:200'],
            'exercises_correct' => ['required', 'integer', 'min:0', 'lte:exercises_total'],
            'duration_seconds' => ['required', 'integer', 'min:0', 'max:7200'],
        ];
    }

    /**
     * Get the validated item results.
     *
     * @return list<array{item_id: string, correct: bool}>
     */
    public function results(): array
    {
        /** @var list<array{item_id: string, correct: bool|int|string}> $results */
        $results = $this->validated('results');

        return array_map(fn (array $result): array => [
            'item_id' => $result['item_id'],
            'correct' => filter_var($result['correct'], FILTER_VALIDATE_BOOLEAN),
        ], $results);
    }

    /**
     * Get the ids of the items in the results.
     *
     * @return list<string>
     */
    public function itemIds(): array
    {
        return array_column($this->results(), 'item_id');
    }
}

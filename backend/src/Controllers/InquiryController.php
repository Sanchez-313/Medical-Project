<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;

final class InquiryController extends Controller
{
    public function store(Request $request): void
    {
        $name = trim((string) $request->body('fullName', ''));
        $email = strtolower(trim((string) $request->body('email', '')));
        $subject = trim((string) $request->body('subject', 'General inquiry'));
        $message = trim((string) $request->body('message', ''));

        if ($name === '' || $email === '' || $message === '') {
            $this->badRequest('fullName, email and message are required');
            return;
        }

        $db = Database::connection();
        $stmt = $db->prepare('INSERT INTO inquiries (full_name, email, subject, message) VALUES (:full_name, :email, :subject, :message)');
        $stmt->execute([
            'full_name' => $name,
            'email' => $email,
            'subject' => $subject,
            'message' => $message,
        ]);

        $this->ok([
            'id' => (int) $db->lastInsertId(),
            'status' => 'received',
        ], 201);
    }
}

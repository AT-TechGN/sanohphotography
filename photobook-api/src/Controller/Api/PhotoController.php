<?php

namespace App\Controller\Api;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class PhotoController extends AbstractController
{
    #[Route('/api/photo', name: 'app_api_photo')]
    public function index(): Response
    {
        return $this->render('api/photo/index.html.twig', [
            'controller_name' => 'Api/PhotoController',
        ]);
    }
}

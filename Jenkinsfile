pipeline {
    agent any

    stages {
        stage('Build & Run') {
            steps {
                sh '''
                docker build -t spend-ai .
                docker rm -f spend-container || true
                docker run -d -p 8095:80 --name spend-container spend-ai
                '''
            }
        }
    }
}
